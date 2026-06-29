'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Terminal } from 'lucide-react'
import CodeBlock from '@/components/ui/CodeBlock'

export default function DocsSDKs() {
  const sdks = [
    {
      name: "JavaScript/TypeScript",
      description: "Modern SDK for Node.js and browser environments",
      icon: "📘",
      version: "2.0.0",
      href: "#javascript",
      readTime: "10 min"
    },
    {
      name: "Python",
      description: "Complete Python SDK with async support",
      icon: "🐍",
      version: "1.8.0",
      href: "#python",
      readTime: "10 min"
    },
    {
      name: "Go",
      description: "High-performance Go SDK for enterprise applications",
      icon: "🐹",
      version: "1.5.0",
      href: "#go",
      readTime: "9 min"
    },
    {
      name: "PHP",
      description: "Full-featured PHP SDK for web applications",
      icon: "🚀",
      version: "2.1.0",
      href: "#php",
      readTime: "8 min"
    },
    {
      name: "Ruby",
      description: "Ruby gem for seamless integration",
      icon: "💎",
      version: "1.3.0",
      href: "#ruby",
      readTime: "8 min"
    },
    {
      name: "Java",
      description: "Enterprise-grade Java SDK",
      icon: "☕",
      version: "2.2.0",
      href: "#java",
      readTime: "11 min"
    }
  ]

  const featureComparison = [
    { feature: "RESTful API Support", js: true, py: true, go: true, php: true },
    { feature: "Real-time Streaming", js: true, py: true, go: true, php: false },
    { feature: "File Upload", js: true, py: true, go: true, php: true },
    { feature: "Error Handling", js: true, py: true, go: true, php: true },
    { feature: "Type Safety", js: true, py: false, go: true, php: false },
    { feature: "Async/Await", js: true, py: true, go: true, php: false },
    { feature: "WebSocket Support", js: true, py: true, go: true, php: false },
    { feature: "Rate Limiting", js: true, py: true, go: true, php: true }
  ]

  // Code snippets
  const jsInstallNpm = `npm install @mumtazai/sdk`
  const jsInstallYarn = `yarn add @mumtazai/sdk`
  
  const jsBasicUsage = `import { MumtazAI } from '@mumtazai/sdk';

const client = new MumtazAI({
  apiKey: process.env.MUMTAZAI_API_KEY
});

// Get all agents
const agents = await client.agents.list();

// Send a message to an agent
const response = await client.conversations.send({
  agentId: 'agent_123',
  message: 'Hello, how are you?'
});

console.log(response.reply);`

  const jsCreateAgent = `const newAgent = await client.agents.create({
  name: 'My Bot',
  personality: 'helpful',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant'
});

console.log(newAgent.id);`

  const pyInstall = `pip install mumtazai-sdk`
  
  const pyBasicUsage = `from mumtazai import MumtazAI

client = MumtazAI(api_key='YOUR_API_KEY')

# Get all agents
agents = client.agents.list()

# Send a message
response = client.conversations.send(
  agent_id='agent_123',
  message='Hello, how are you?'
)

print(response['reply'])`

  const pyAsyncUsage = `import asyncio
from mumtazai import AsyncMumtazAI

async def main():
  client = AsyncMumtazAI(api_key='YOUR_API_KEY')
  
  response = await client.conversations.send(
    agent_id='agent_123',
    message='Hello!'
  )
  
  print(response['reply'])

asyncio.run(main())`

  const goInstall = `go get github.com/mumtazai/sdk-go`
  
  const goBasicUsage = `package main

import (
  "fmt"
  "github.com/mumtazai/sdk-go"
)

func main() {
  client := mumtazai.NewClient("YOUR_API_KEY")
  
  // List agents
  agents, err := client.Agents.List()
  if err != nil {
    panic(err)
  }
  
  // Send message
  response, err := client.Conversations.Send(&mumtazai.Message{
    AgentID: "agent_123",
    Text:    "Hello!",
  })
  
  fmt.Println(response.Reply)
}`

  const phpInstall = `composer require mumtazai/sdk-php`
  
  const phpBasicUsage = `<?php
require 'vendor/autoload.php';

use MumtazAI\\Client;

$client = new Client([
  'api_key' => 'YOUR_API_KEY'
]);

// List agents
$agents = $client->agents->list();

// Send message
$response = $client->conversations->send([
  'agent_id' => 'agent_123',
  'message' => 'Hello!'
]);

echo $response['reply'];
?>`

  const rubyInstall = `gem install mumtazai-sdk`
  
  const rubyBasicUsage = `require 'mumtazai'

client = MumtazAI::Client.new(api_key: ENV['MUMTAZAI_API_KEY'])

# List agents
agents = client.agents.list

# Send message
response = client.conversations.send(
  agent_id: 'agent_123',
  message: 'Hello!'
)

puts response['reply']`

  const javaInstall = `<dependency>
  <groupId>com.mumtazai</groupId>
  <artifactId>sdk-java</artifactId>
  <version>2.2.0</version>
</dependency>`
  
  const javaBasicUsage = `import com.mumtazai.sdk.MumtazAI;
import com.mumtazai.sdk.models.Agent;

public class Main {
  public static void main(String[] args) {
    MumtazAI client = new MumtazAI("YOUR_API_KEY");
    
    // List agents
    List<Agent> agents = client.agents().list();
    
    // Send message
    String response = client.conversations()
      .send("agent_123", "Hello!");
    
    System.out.println(response);
  }
}`

  const errorHandling = `try {
  const response = await client
    .conversations.send({...});
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Handle rate limit
  } else if (error.code === 'AUTH_ERROR') {
    // Handle auth error
  } else {
    // Handle other errors
  }
}`

  const retryLogic = `const maxRetries = 3;
let attempt = 0;

while (attempt < maxRetries) {
  try {
    return await client.agents.list();
  } catch (error) {
    attempt++;
    await sleep(Math.pow(2, attempt) * 1000);
  }
}`

  const pagination = `const agents = [];
let page = 1;

while (true) {
  const result = await client
    .agents.list({
      page: page,
      limit: 50
    });
  
  agents.push(...result.data);
  
  if (!result.hasMore) break;
  page++;
}`

  const streaming = `const stream = await client
  .conversations.stream({
    agentId: 'agent_123',
    message: 'Write a poem'
  });

for await (const chunk of stream) {
  process.stdout.write(chunk.data);
}`

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
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <Link href="/docs" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-700 mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Docs</Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 p-2.5 bg-white/40 border border-white/60 rounded-2xl shadow-lg flex items-center justify-center"><Terminal className="w-10 h-10 text-purple-600" /></div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">SDKs & Libraries</h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Official SDKs for popular programming languages. Simplify your integration with production-ready libraries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#quickstart" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] px-6 py-3 rounded-lg font-semibold transition-all">Quick Start</a>
              <a href="#available" className="bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 hover:bg-white/50 px-6 py-3 rounded-lg font-semibold transition-colors">View All SDKs</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-custom section-padding">
        
        {/* SDK Overview */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Easy to Use</h3>
              <p className="text-slate-500 text-sm">
                Simple APIs that make it easy to integrate Mumtaz AI into your apps
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Well-Maintained</h3>
              <p className="text-slate-500 text-sm">
                Regularly updated with bug fixes and new features
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Fully Documented</h3>
              <p className="text-slate-500 text-sm">
                Comprehensive documentation with examples for every feature
              </p>
            </div>
          </div>
        </div>

        {/* Available SDKs */}
        <div id="available" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Available SDKs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sdks.map((sdk, index) => (
              <a key={index} href={sdk.href} className="group glass-card p-6 hover:shadow-md hover:border-blue-300 transition-all duration-300 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{sdk.icon}</div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    v{sdk.version}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {sdk.name}
                </h3>
                <p className="text-slate-500 text-sm mb-4 flex-grow">
                  {sdk.description}
                </p>
                <span className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                  Learn more →
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Installation Guide */}
        <div id="quickstart" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Installation Guide</h2>

          {/* JavaScript */}
          <div id="javascript" className="glass-card p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">📘</div>
              <h3 className="text-2xl font-bold text-slate-800">JavaScript/TypeScript</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-800 mb-3">Installation</h4>
              <CodeBlock code={jsInstallNpm} language="bash" title="npm" />
              <p className="text-slate-500 text-sm my-3">or with yarn:</p>
              <CodeBlock code={jsInstallYarn} language="bash" title="yarn" />
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-800 mb-3">Basic Usage</h4>
              <CodeBlock code={jsBasicUsage} language="javascript" showLineNumbers />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-3">Creating an Agent</h4>
              <CodeBlock code={jsCreateAgent} language="javascript" showLineNumbers />
            </div>
          </div>

          {/* Python */}
          <div id="python" className="glass-card p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🐍</div>
              <h3 className="text-2xl font-bold text-slate-800">Python</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-800 mb-3">Installation</h4>
              <CodeBlock code={pyInstall} language="bash" title="pip" />
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-800 mb-3">Basic Usage</h4>
              <CodeBlock code={pyBasicUsage} language="python" showLineNumbers />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-3">Async Support</h4>
              <CodeBlock code={pyAsyncUsage} language="python" showLineNumbers />
            </div>
          </div>

          {/* Go */}
          <div id="go" className="glass-card p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🐹</div>
              <h3 className="text-2xl font-bold text-slate-800">Go</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-800 mb-3">Installation</h4>
              <CodeBlock code={goInstall} language="bash" title="go get" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-3">Basic Usage</h4>
              <CodeBlock code={goBasicUsage} language="go" showLineNumbers />
            </div>
          </div>

          {/* PHP */}
          <div id="php" className="glass-card p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🚀</div>
              <h3 className="text-2xl font-bold text-slate-800">PHP</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-800 mb-3">Installation</h4>
              <CodeBlock code={phpInstall} language="bash" title="composer" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-3">Basic Usage</h4>
              <CodeBlock code={phpBasicUsage} language="php" showLineNumbers />
            </div>
          </div>

          {/* Ruby */}
          <div id="ruby" className="glass-card p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">💎</div>
              <h3 className="text-2xl font-bold text-slate-800">Ruby</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-800 mb-3">Installation</h4>
              <CodeBlock code={rubyInstall} language="bash" title="gem" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-3">Basic Usage</h4>
              <CodeBlock code={rubyBasicUsage} language="ruby" showLineNumbers />
            </div>
          </div>

          {/* Java */}
          <div id="java" className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">☕</div>
              <h3 className="text-2xl font-bold text-slate-800">Java</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-800 mb-3">Installation</h4>
              <p className="text-slate-500 mb-3">Add to your pom.xml:</p>
              <CodeBlock code={javaInstall} language="xml" title="pom.xml" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-3">Basic Usage</h4>
              <CodeBlock code={javaBasicUsage} language="java" showLineNumbers />
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">SDK Feature Comparison</h2>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/80 bg-gray-50">
                    <th className="text-left py-4 px-4 font-bold text-slate-800">Feature</th>
                    <th className="text-center py-4 px-4 font-bold text-slate-800">JavaScript</th>
                    <th className="text-center py-4 px-4 font-bold text-slate-800">Python</th>
                    <th className="text-center py-4 px-4 font-bold text-slate-800">Go</th>
                    <th className="text-center py-4 px-4 font-bold text-slate-800">PHP</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((row, index) => (
                    <tr key={index} className="border-b border-white/80 hover:bg-gray-50">
                      <td className="py-4 px-4 text-slate-600">{row.feature}</td>
                      <td className="text-center py-4 px-4">
                        {row.js ? <span className="text-green-600">✓</span> : <span className="text-gray-400">✗</span>}
                      </td>
                      <td className="text-center py-4 px-4">
                        {row.py ? <span className="text-green-600">✓</span> : <span className="text-gray-400">✗</span>}
                      </td>
                      <td className="text-center py-4 px-4">
                        {row.go ? <span className="text-green-600">✓</span> : <span className="text-gray-400">✗</span>}
                      </td>
                      <td className="text-center py-4 px-4">
                        {row.php ? <span className="text-green-600">✓</span> : <span className="text-gray-400">✗</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Common Patterns */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8">Common Patterns</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Error Handling</h3>
              <CodeBlock code={errorHandling} language="javascript" />
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Retry Logic</h3>
              <CodeBlock code={retryLogic} language="javascript" />
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Pagination</h3>
              <CodeBlock code={pagination} language="javascript" />
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Streaming Responses</h3>
              <CodeBlock code={streaming} language="javascript" />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center themed-section-bg">
          <div className="absolute -left-10 top-1/4 w-48 h-[300px] rounded-[80px] rotate-12 bg-gradient-to-br from-white/40 via-purple-200/30 to-transparent backdrop-blur-sm border border-white/50" />
          <div className="absolute -right-10 -top-10 w-56 h-[350px] rounded-[80px] -rotate-12 bg-gradient-to-bl from-white/30 via-indigo-200/20 to-transparent backdrop-blur-sm border border-white/40" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">Ready to Start Coding?</h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Choose your SDK, follow the installation guide, and start building powerful AI agent applications today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs/tutorials" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all">
                View Tutorials
              </Link>
              <Link href="/docs/api" className="px-6 py-3 bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 hover:bg-white/50 rounded-lg font-semibold transition-colors">
                API Reference
              </Link>
              <Link href="/support/contact-us" className="px-6 py-3 bg-white/40 backdrop-blur-sm text-slate-700 border border-white/60 hover:bg-white/50 rounded-lg font-semibold transition-colors">
                Get Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
