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
  const jsInstallNpm = `npm install @onelastai/sdk`
  const jsInstallYarn = `yarn add @onelastai/sdk`
  
  const jsBasicUsage = `import { OnelastAI } from '@onelastai/sdk';

const client = new OnelastAI({
  apiKey: process.env.ONELASTAI_API_KEY
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

  const pyInstall = `pip install onelastai-sdk`
  
  const pyBasicUsage = `from onelastai import OnelastAI

client = OnelastAI(api_key='YOUR_API_KEY')

# Get all agents
agents = client.agents.list()

# Send a message
response = client.conversations.send(
  agent_id='agent_123',
  message='Hello, how are you?'
)

print(response['reply'])`

  const pyAsyncUsage = `import asyncio
from onelastai import AsyncOnelastAI

async def main():
  client = AsyncOnelastAI(api_key='YOUR_API_KEY')
  
  response = await client.conversations.send(
    agent_id='agent_123',
    message='Hello!'
  )
  
  print(response['reply'])

asyncio.run(main())`

  const goInstall = `go get github.com/onelastai/sdk-go`
  
  const goBasicUsage = `package main

import (
  "fmt"
  "github.com/onelastai/sdk-go"
)

func main() {
  client := onelastai.NewClient("YOUR_API_KEY")
  
  // List agents
  agents, err := client.Agents.List()
  if err != nil {
    panic(err)
  }
  
  // Send message
  response, err := client.Conversations.Send(&onelastai.Message{
    AgentID: "agent_123",
    Text:    "Hello!",
  })
  
  fmt.Println(response.Reply)
}`

  const phpInstall = `composer require onelastai/sdk-php`
  
  const phpBasicUsage = `<?php
require 'vendor/autoload.php';

use OnelastAI\\Client;

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

  const rubyInstall = `gem install onelastai-sdk`
  
  const rubyBasicUsage = `require 'onelastai'

client = OnelastAI::Client.new(api_key: ENV['ONELASTAI_API_KEY'])

# List agents
agents = client.agents.list

# Send message
response = client.conversations.send(
  agent_id: 'agent_123',
  message: 'Hello!'
)

puts response['reply']`

  const javaInstall = `<dependency>
  <groupId>com.onelastai</groupId>
  <artifactId>sdk-java</artifactId>
  <version>2.2.0</version>
</dependency>`
  
  const javaBasicUsage = `import com.onelastai.sdk.OnelastAI;
import com.onelastai.sdk.models.Agent;

public class Main {
  public static void main(String[] args) {
    OnelastAI client = new OnelastAI("YOUR_API_KEY");
    
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="sdk-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#sdk-grid)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <Link href="/docs" className="inline-flex items-center gap-2 text-teal-200 hover:text-white mb-6 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Docs</Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"><Terminal className="w-10 h-10 text-white" /></div>
              <h1 className="text-5xl md:text-6xl font-bold text-white">SDKs & Libraries</h1>
            </div>
            <p className="text-xl text-teal-100 max-w-3xl mx-auto mb-8">
              Official SDKs for popular programming languages. Simplify your integration with production-ready libraries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#quickstart" className="bg-white text-teal-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors">Quick Start</a>
              <a href="#available" className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold transition-colors">View All SDKs</a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom section-padding">
        
        {/* SDK Overview */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200 text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-bold text-neural-900 mb-2">Easy to Use</h3>
              <p className="text-neural-600 text-sm">
                Simple APIs that make it easy to integrate One Last AI into your apps
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-bold text-neural-900 mb-2">Well-Maintained</h3>
              <p className="text-neural-600 text-sm">
                Regularly updated with bug fixes and new features
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200 text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-bold text-neural-900 mb-2">Fully Documented</h3>
              <p className="text-neural-600 text-sm">
                Comprehensive documentation with examples for every feature
              </p>
            </div>
          </div>
        </div>

        {/* Available SDKs */}
        <div id="available" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Available SDKs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sdks.map((sdk, index) => (
              <a key={index} href={sdk.href} className="group bg-white rounded-2xl p-6 shadow-sm border border-neural-200 hover:shadow-md hover:border-brand-300 transition-all duration-300 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{sdk.icon}</div>
                  <span className="text-xs font-bold text-brand-600 bg-brand-100 px-2 py-1 rounded">
                    v{sdk.version}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neural-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {sdk.name}
                </h3>
                <p className="text-neural-600 text-sm mb-4 flex-grow">
                  {sdk.description}
                </p>
                <span className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors">
                  Learn more →
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Installation Guide */}
        <div id="quickstart" className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Installation Guide</h2>

          {/* JavaScript */}
          <div id="javascript" className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">📘</div>
              <h3 className="text-2xl font-bold text-neural-900">JavaScript/TypeScript</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-neural-900 mb-3">Installation</h4>
              <CodeBlock code={jsInstallNpm} language="bash" title="npm" />
              <p className="text-neural-600 text-sm my-3">or with yarn:</p>
              <CodeBlock code={jsInstallYarn} language="bash" title="yarn" />
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-neural-900 mb-3">Basic Usage</h4>
              <CodeBlock code={jsBasicUsage} language="javascript" showLineNumbers />
            </div>

            <div>
              <h4 className="text-lg font-bold text-neural-900 mb-3">Creating an Agent</h4>
              <CodeBlock code={jsCreateAgent} language="javascript" showLineNumbers />
            </div>
          </div>

          {/* Python */}
          <div id="python" className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🐍</div>
              <h3 className="text-2xl font-bold text-neural-900">Python</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-neural-900 mb-3">Installation</h4>
              <CodeBlock code={pyInstall} language="bash" title="pip" />
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-neural-900 mb-3">Basic Usage</h4>
              <CodeBlock code={pyBasicUsage} language="python" showLineNumbers />
            </div>

            <div>
              <h4 className="text-lg font-bold text-neural-900 mb-3">Async Support</h4>
              <CodeBlock code={pyAsyncUsage} language="python" showLineNumbers />
            </div>
          </div>

          {/* Go */}
          <div id="go" className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🐹</div>
              <h3 className="text-2xl font-bold text-neural-900">Go</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-neural-900 mb-3">Installation</h4>
              <CodeBlock code={goInstall} language="bash" title="go get" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-neural-900 mb-3">Basic Usage</h4>
              <CodeBlock code={goBasicUsage} language="go" showLineNumbers />
            </div>
          </div>

          {/* PHP */}
          <div id="php" className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🚀</div>
              <h3 className="text-2xl font-bold text-neural-900">PHP</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-neural-900 mb-3">Installation</h4>
              <CodeBlock code={phpInstall} language="bash" title="composer" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-neural-900 mb-3">Basic Usage</h4>
              <CodeBlock code={phpBasicUsage} language="php" showLineNumbers />
            </div>
          </div>

          {/* Ruby */}
          <div id="ruby" className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">💎</div>
              <h3 className="text-2xl font-bold text-neural-900">Ruby</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-neural-900 mb-3">Installation</h4>
              <CodeBlock code={rubyInstall} language="bash" title="gem" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-neural-900 mb-3">Basic Usage</h4>
              <CodeBlock code={rubyBasicUsage} language="ruby" showLineNumbers />
            </div>
          </div>

          {/* Java */}
          <div id="java" className="bg-white rounded-2xl p-8 shadow-sm border border-neural-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">☕</div>
              <h3 className="text-2xl font-bold text-neural-900">Java</h3>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-neural-900 mb-3">Installation</h4>
              <p className="text-neural-600 mb-3">Add to your pom.xml:</p>
              <CodeBlock code={javaInstall} language="xml" title="pom.xml" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-neural-900 mb-3">Basic Usage</h4>
              <CodeBlock code={javaBasicUsage} language="java" showLineNumbers />
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neural-900 mb-8">SDK Feature Comparison</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-neural-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neural-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-bold text-neural-900">Feature</th>
                    <th className="text-center py-4 px-4 font-bold text-neural-900">JavaScript</th>
                    <th className="text-center py-4 px-4 font-bold text-neural-900">Python</th>
                    <th className="text-center py-4 px-4 font-bold text-neural-900">Go</th>
                    <th className="text-center py-4 px-4 font-bold text-neural-900">PHP</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((row, index) => (
                    <tr key={index} className="border-b border-neural-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-neural-700">{row.feature}</td>
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
          <h2 className="text-3xl font-bold text-neural-900 mb-8">Common Patterns</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-4">Error Handling</h3>
              <CodeBlock code={errorHandling} language="javascript" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-4">Retry Logic</h3>
              <CodeBlock code={retryLogic} language="javascript" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-4">Pagination</h3>
              <CodeBlock code={pagination} language="javascript" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neural-200">
              <h3 className="text-lg font-bold text-neural-900 mb-4">Streaming Responses</h3>
              <CodeBlock code={streaming} language="javascript" />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Coding?</h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Choose your SDK, follow the installation guide, and start building powerful AI agent applications today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs/tutorials" className="bg-white text-brand-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              View Tutorials
            </Link>
            <Link href="/docs/api" className="border-2 border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              API Reference
            </Link>
            <Link href="/support/contact-us" className="border-2 border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Get Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
