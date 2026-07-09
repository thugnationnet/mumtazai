'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, GraduationCap } from 'lucide-react'

export default function DocsTutorials() {
  const tutorials = [
    {
      title: "Getting Started",
      description: "Learn the basics and create your first AI agent in minutes",
      category: "Beginner",
      readTime: "5 min",
      href: "#getting-started",
      icon: "🚀"
    },
    {
      title: "Creating Your First Bot",
      description: "Step-by-step guide to build a functional bot",
      category: "Beginner",
      readTime: "15 min",
      href: "#first-bot",
      icon: "🤖"
    },
    {
      title: "Advanced Features",
      description: "Explore advanced configuration and customization",
      category: "Advanced",
      readTime: "20 min",
      href: "#advanced",
      icon: "⚡"
    },
    {
      title: "Building Workflows",
      description: "Create complex multi-step conversations and workflows",
      category: "Advanced",
      readTime: "25 min",
      href: "#workflows",
      icon: "🔄"
    },
    {
      title: "Real-World Use Cases",
      description: "Learn from real-world examples and best practices",
      category: "Examples",
      readTime: "30 min",
      href: "#usecases",
      icon: "💡"
    },
    {
      title: "Deployment Guide",
      description: "Deploy your agents to production",
      category: "Production",
      readTime: "15 min",
      href: "#deployment",
      icon: "🚢"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="tut-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#tut-grid)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <Link href="/docs" className="inline-flex items-center gap-2 text-indigo-200 hover:text-white mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Docs</Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"><GraduationCap className="w-10 h-10 text-white" /></div>
              <h1 className="text-5xl md:text-6xl font-bold text-white">Tutorials & Guides</h1>
            </div>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto mb-8">
              Learn how to build, configure, and deploy AI agents. From beginner guides to advanced techniques.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#getting-started" className="bg-white text-indigo-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors">Start Learning</a>
              <a href="#browse" className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors">Browse All Tutorials</a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom section-padding-lg">
        
        {/* Quick Stats */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <p className="text-neural-700">Tutorials & Guides</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
              <p className="text-neural-700">Code Examples</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10+ hrs</div>
              <p className="text-neural-700">Learning Content</p>
            </div>
          </div>
        </div>

        {/* Browse Tutorials */}
        <div id="browse" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Browse Tutorials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial, index) => (
              <a key={index} href={tutorial.href} className="group bg-white rounded-2xl p-6 shadow-sm border border-neural-200 hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer">
                <div className="text-3xl mb-4">{tutorial.icon}</div>
                <div className="mb-4">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {tutorial.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neural-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {tutorial.title}
                </h3>
                <p className="text-neural-600 text-sm mb-4 flex-grow">
                  {tutorial.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neural-500">⏱️ {tutorial.readTime}</span>
                  <span className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                    →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div id="getting-started" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Getting Started</h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
            <p className="text-neural-700 mb-6 text-lg">
              Welcome to One Last AI! This guide will help you create your first AI agent in just a few minutes.
            </p>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Step 1: Sign Up & Get API Key</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                  <div>
                    <p className="font-semibold text-neural-900">Create an account on One Last AI</p>
                    <p className="text-neural-600 text-sm">Visit the dashboard and sign up with your email</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                  <div>
                    <p className="font-semibold text-neural-900">Navigate to API Settings</p>
                    <p className="text-neural-600 text-sm">Go to Settings → Developer → API Keys</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                  <div>
                    <p className="font-semibold text-neural-900">Generate your API key</p>
                    <p className="text-neural-600 text-sm">Click "Create New Key" and keep it secure</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Step 2: Choose Your SDK</h3>
              <p className="text-neural-700 mb-4">Install the SDK for your programming language:</p>
              <div className="bg-gray-900 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-gray-400 text-sm mb-1">JavaScript:</p>
                  <code className="text-gray-200">npm install @One Last AI/sdk</code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Python:</p>
                  <code className="text-gray-200">pip install One Last AI-sdk</code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Go:</p>
                  <code className="text-gray-200">go get github.com/One Last AI/sdk-go</code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Step 3: Create Your First Agent</h3>
              <div className="bg-gray-900 p-4 rounded-lg">
                <code className="text-gray-200 text-sm">
                  {`import { One Last AI } from '@One Last AI/sdk';

// Initialize client
const client = new One Last AI({
  apiKey: process.env.One Last AI_API_KEY
});

// Create an agent
const agent = await client.agents.create({
  name: 'My First Bot',
  personality: 'friendly',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful AI assistant'
});

console.log('Agent created:', agent.id);`}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Creating Your First Bot */}
        <div id="first-bot" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Creating Your First Bot</h2>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Overview</h3>
              <p className="text-neural-700 mb-6">
                In this tutorial, we'll create a helpful customer support bot that can:
              </p>
              <ul className="space-y-3 text-neural-700">
                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  <span>Answer frequently asked questions</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  <span>Collect customer information</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  <span>Escalate complex issues to humans</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600">✓</span>
                  <span>Maintain conversation context</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Complete Example</h3>
              <div className="bg-gray-900 p-4 rounded-lg">
                <code className="text-gray-200 text-sm">
                  {`import { One Last AI } from '@One Last AI/sdk';

const client = new One Last AI({
  apiKey: process.env.One Last AI_API_KEY
});

// Create the support bot
const bot = await client.agents.create({
  name: 'Support Bot',
  personality: 'professional and helpful',
  model: 'gpt-4',
  systemPrompt: \`You are a customer support agent.
Your role is to:
1. Answer customer questions helpfully
2. Collect information needed for support tickets
3. Provide order and account information
4. Escalate complex issues to human agents

Be polite, professional, and efficient.\`,
  knowledge_base: {
    faqs: [
      {
        question: 'How do I reset my password?',
        answer: 'Go to login, click "Forgot Password", and follow the steps'
      },
      {
        question: 'What are your business hours?',
        answer: 'We\\'re available 24/7 for support'
      }
    ]
  }
});

// Test the bot
const conversation = await client.conversations.send({
  agent_id: bot.id,
  message: 'I forgot my password, how do I reset it?'
});

console.log('Bot response:', conversation.reply);`}
                </code>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Key Configuration Options</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-neural-900 mb-2">name</h4>
                  <p className="text-neural-600">A unique name for your agent</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-neural-900 mb-2">personality</h4>
                  <p className="text-neural-600">The persona of your agent (e.g., "professional", "friendly", "expert")</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-neural-900 mb-2">model</h4>
                  <p className="text-neural-600">AI model to use (gpt-4, gpt-3.5-turbo, etc.)</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-neural-900 mb-2">systemPrompt</h4>
                  <p className="text-neural-600">Instructions that define the agent's behavior</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div id="advanced" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Advanced Features</h2>
          
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Context & Memory</h3>
              <p className="text-neural-700 mb-4">
                Keep track of conversation context across multiple messages:
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <code className="text-gray-200 text-sm">
                  {`// Start a conversation with context
const conversation = await client.conversations.create({
  agent_id: bot.id,
  context: {
    user_id: 'user_123',
    customer_name: 'John Doe',
    account_type: 'premium',
    previous_issues: ['billing', 'login']
  }
});

// Send messages (context is maintained)
const response1 = await client.conversations.send({
  conversation_id: conversation.id,
  message: 'I have a billing issue'
});

// Agent remembers previous issues
const response2 = await client.conversations.send({
  conversation_id: conversation.id,
  message: 'Can you help me with this?'
});`}
                </code>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Custom Actions</h3>
              <p className="text-neural-700 mb-4">
                Let your agent take actions like creating tickets or updating data:
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <code className="text-gray-200 text-sm">
                  {`// Define custom actions
const bot = await client.agents.create({
  name: 'Advanced Bot',
  actions: [
    {
      name: 'create_ticket',
      description: 'Create a support ticket',
      parameters: {
        title: 'string',
        description: 'string',
        priority: 'low|medium|high'
      }
    },
    {
      name: 'get_order_info',
      description: 'Retrieve order information',
      parameters: {
        order_id: 'string'
      }
    }
  ]
});

// Agent can now use these actions
const response = await client.conversations.send({
  agent_id: bot.id,
  message: 'I need to create a support ticket'
});

// Check if action was triggered
if (response.actions.length > 0) {
  const action = response.actions[0];
  console.log('Action:', action.name);
  console.log('Parameters:', action.parameters);
}`}
                </code>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Streaming Responses</h3>
              <p className="text-neural-700 mb-4">
                Get real-time streaming for long responses:
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <code className="text-gray-200 text-sm">
                  {`// Stream response in real-time
const stream = await client.conversations.stream({
  agent_id: bot.id,
  message: 'Tell me about your services',
  stream: true
});

// Process chunks as they arrive
for await (const chunk of stream) {
  process.stdout.write(chunk.data);
}

console.log('\\n✓ Complete');`}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Workflows */}
        <div id="workflows" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Building Workflows</h2>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
            <h3 className="text-2xl font-bold text-neural-900 mb-6">Multi-Step Workflows</h3>
            <p className="text-neural-700 mb-6">
              Create complex conversations with multiple steps and conditions:
            </p>

            <div className="bg-gray-900 p-4 rounded-lg mb-6">
              <code className="text-gray-200 text-sm">
                {`// Define a workflow
const workflow = {
  name: 'Support Workflow',
  steps: [
    {
      id: 'greeting',
      prompt: 'Greet the user and ask what they need help with',
      next: 'analyze'
    },
    {
      id: 'analyze',
      prompt: 'Analyze the issue and determine if it requires escalation',
      next_if: {
        'requires_escalation': 'escalate',
        'default': 'solve'
      }
    },
    {
      id: 'solve',
      prompt: 'Provide a solution to the issue',
      next: 'satisfaction'
    },
    {
      id: 'escalate',
      prompt: 'Explain that this needs human review and collect info',
      next: 'satisfaction'
    },
    {
      id: 'satisfaction',
      prompt: 'Ask if the user is satisfied with the resolution',
      next: 'end'
    }
  ]
};

// Execute workflow
const bot = await client.agents.create({
  name: 'Workflow Bot',
  workflow: workflow
});`}
              </code>
            </div>

            <p className="text-neural-700">
              This creates a natural, multi-step conversation flow that guides both the agent and user through a complete support interaction.
            </p>
          </div>
        </div>

        {/* Real-World Use Cases */}
        <div id="usecases" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Real-World Use Cases</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-3">E-Commerce</h3>
              <ul className="space-y-2 text-neural-700 text-sm">
                <li>✓ Product recommendations</li>
                <li>✓ Order tracking</li>
                <li>✓ Return processing</li>
                <li>✓ Customer support</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-3">Healthcare</h3>
              <ul className="space-y-2 text-neural-700 text-sm">
                <li>✓ Appointment scheduling</li>
                <li>✓ Symptom checking</li>
                <li>✓ Medication reminders</li>
                <li>✓ Patient triage</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-3">Banking</h3>
              <ul className="space-y-2 text-neural-700 text-sm">
                <li>✓ Account inquiries</li>
                <li>✓ Fraud detection</li>
                <li>✓ Loan applications</li>
                <li>✓ Customer onboarding</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-3">Education</h3>
              <ul className="space-y-2 text-neural-700 text-sm">
                <li>✓ Tutoring & mentoring</li>
                <li>✓ Course information</li>
                <li>✓ Student support</li>
                <li>✓ Assignment help</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Deployment */}
        <div id="deployment" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Deployment Guide</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Pre-Deployment Checklist</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-blue-600">□</span>
                  <span className="text-neural-700">All agent configurations are finalized</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-600">□</span>
                  <span className="text-neural-700">Thoroughly tested all conversation flows</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-600">□</span>
                  <span className="text-neural-700">API keys are secure and not hardcoded</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-600">□</span>
                  <span className="text-neural-700">Error handling is implemented</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-600">□</span>
                  <span className="text-neural-700">Monitoring and logging are in place</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-blue-600">□</span>
                  <span className="text-neural-700">Rate limits are understood</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Environment Setup</h3>
              <div className="bg-gray-900 p-4 rounded-lg">
                <code className="text-gray-200 text-sm">
                  {`# .env.production
One Last AI_API_KEY=your-production-key
One Last AI_ENV=production
NODE_ENV=production
LOG_LEVEL=info

# Optional: Enable monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key`}
                </code>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
              <h3 className="text-2xl font-bold text-neural-900 mb-6">Monitoring & Logging</h3>
              <div className="bg-gray-900 p-4 rounded-lg">
                <code className="text-gray-200 text-sm">
                  {`// Set up logging
const client = new One Last AI({
  apiKey: process.env.One Last AI_API_KEY,
  logLevel: 'info',
  onError: (error) => {
    console.error('Agent Error:', error);
    // Send to monitoring service
    captureException(error);
  },
  onEvent: (event) => {
    console.log('Event:', event.type);
    // Track metrics
    trackMetric(event.type);
  }
});`}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Path */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Recommended Learning Path</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div className="flex-grow">
                  <h4 className="font-bold text-neural-900 mb-2">Beginner (Week 1-2)</h4>
                  <p className="text-neural-600 text-sm">Start with Getting Started guide, create first bot, explore basic features</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div className="flex-grow">
                  <h4 className="font-bold text-neural-900 mb-2">Intermediate (Week 3-4)</h4>
                  <p className="text-neural-600 text-sm">Learn integrations, SDKs, and build your first real application</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div className="flex-grow">
                  <h4 className="font-bold text-neural-900 mb-2">Advanced (Week 5-6)</h4>
                  <p className="text-neural-600 text-sm">Master workflows, custom actions, and deployment strategies</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <div className="flex-grow">
                  <h4 className="font-bold text-neural-900 mb-2">Production (Week 7+)</h4>
                  <p className="text-neural-600 text-sm">Deploy to production, monitor performance, and optimize</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Build?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Start with the Getting Started guide and create your first AI agent today. Our team is here to help every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs/sdks" className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors">
              Choose Your SDK
            </Link>
            <Link href="/docs/api" className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors">
              API Reference
            </Link>
            <Link href="/support/contact-us" className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors">
              Get Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
