'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Brain,
  Mic,
  Languages,
  Server,
  Copy,
  Check,
  ExternalLink,
  Zap,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  ChevronLeft,
  KeyRound,
  FileCode,
} from 'lucide-react';

const envVarSections = [
  {
    title: 'AI Service Providers',
    description: 'Configure AI models for agent responses',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    badgeColor: 'bg-blue-100 text-blue-700',
    vars: [
      {
        name: 'NEXT_PUBLIC_OPENAI_API_KEY',
        description: 'OpenAI API key for GPT models',
        example: 'sk-...',
        required: false,
        link: 'https://platform.openai.com/api-keys',
      },
      {
        name: 'NEXT_PUBLIC_ANTHROPIC_API_KEY',
        description: 'Anthropic API key for Claude models',
        example: 'sk-ant-...',
        required: false,
        link: 'https://console.anthropic.com/keys',
      },
      {
        name: 'NEXT_PUBLIC_GEMINI_API_KEY',
        description: 'Google Gemini API key',
        example: 'AIza...',
        required: false,
        link: 'https://aistudio.google.com/app/apikey',
      },
      {
        name: 'NEXT_PUBLIC_COHERE_API_KEY',
        description: 'Cohere API key for Command models',
        example: 'co_...',
        required: false,
        link: 'https://dashboard.cohere.ai/api-keys',
      },
    ],
  },
  {
    title: 'Voice Services',
    description: 'Configure text-to-speech and speech recognition',
    icon: Mic,
    color: 'from-purple-500 to-pink-500',
    badgeColor: 'bg-purple-100 text-purple-700',
    vars: [
      {
        name: 'NEXT_PUBLIC_ELEVENLABS_API_KEY',
        description: 'ElevenLabs API key for high-quality voice synthesis',
        example: 'el_...',
        required: false,
        link: 'https://elevenlabs.io/app/subscription',
      },
      {
        name: 'NEXT_PUBLIC_ELEVENLABS_VOICE_ID',
        description: 'Default voice ID for ElevenLabs',
        example: 'pNInz6obpgDQGcFmaJgB',
        required: false,
      },
      {
        name: 'NEXT_PUBLIC_AZURE_SPEECH_KEY',
        description: 'Azure Cognitive Services Speech key',
        example: 'abc123...',
        required: false,
        link: 'https://portal.azure.com/',
      },
      {
        name: 'NEXT_PUBLIC_AZURE_SPEECH_REGION',
        description: 'Azure Speech service region',
        example: 'eastus',
        required: false,
      },
    ],
  },
  {
    title: 'Translation Services',
    description: 'Configure language translation providers',
    icon: Languages,
    color: 'from-green-500 to-emerald-500',
    badgeColor: 'bg-green-100 text-green-700',
    vars: [
      {
        name: 'NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY',
        description: 'Google Cloud Translation API key',
        example: 'AIza...',
        required: false,
        link: 'https://console.cloud.google.com/apis/credentials',
      },
      {
        name: 'NEXT_PUBLIC_DEEPL_API_KEY',
        description: 'DeepL API key for high-quality translation',
        example: 'abc123:fx',
        required: false,
        link: 'https://www.deepl.com/pro-api',
      },
      {
        name: 'NEXT_PUBLIC_AZURE_TRANSLATOR_KEY',
        description: 'Azure Translator service key',
        example: 'abc123...',
        required: false,
      },
    ],
  },
  {
    title: 'Application Settings',
    description: 'Configure general application behavior',
    icon: Server,
    color: 'from-orange-500 to-red-500',
    badgeColor: 'bg-orange-100 text-orange-700',
    vars: [
      {
        name: 'NEXT_PUBLIC_API_URL',
        description: 'Backend API URL',
        example: 'http://localhost:3002',
        required: true,
      },
      {
        name: 'NEXT_PUBLIC_ENABLE_MULTILINGUAL',
        description: 'Enable multilingual features',
        example: 'true',
        required: false,
      },
      {
        name: 'NEXT_PUBLIC_DEFAULT_LANGUAGE',
        description: 'Default language code',
        example: 'en',
        required: false,
      },
      {
        name: 'NEXT_PUBLIC_ENABLE_VOICE',
        description: 'Enable voice features',
        example: 'true',
        required: false,
      },
      {
        name: 'NEXT_PUBLIC_ENABLE_TRANSLATION',
        description: 'Enable translation features',
        example: 'true',
        required: false,
      },
    ],
  },
];

const totalVars = envVarSections.reduce((sum, s) => sum + s.vars.length, 0);
const requiredVars = envVarSections.reduce(
  (sum, s) => sum + s.vars.filter((v) => v.required).length,
  0
);

function generateEnvTemplate() {
  const lines = ['# Mumtaz AI - Environment Variables', ''];
  envVarSections.forEach((section) => {
    lines.push(`# ${section.title}`);
    lines.push(`# ${section.description}`);
    lines.push('');
    section.vars.forEach((envVar) => {
      lines.push(`# ${envVar.description}`);
      if (envVar.link) {
        lines.push(`# Get your key at: ${envVar.link}`);
      }
      lines.push(`${envVar.name}=${envVar.example}`);
      lines.push('');
    });
    lines.push('');
  });
  return lines.join('\n');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

export default function ConfigSetupPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding neu-hero">
        <div className="container-custom">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-slate-900 transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-6">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Environment Configuration
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Configure your environment variables to enable all features of the
              AI agent system. You only need the services you want to use.
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
                <div className="text-2xl font-bold text-blue-600">
                  {envVarSections.length}
                </div>
                <div className="text-xs text-slate-500">Categories</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {totalVars}
                </div>
                <div className="text-xs text-slate-500">Variables</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {requiredVars}
                </div>
                <div className="text-xs text-slate-500">Required</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {totalVars - requiredVars}
                </div>
                <div className="text-xs text-slate-500">Optional</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Setup Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="glass-card overflow-hidden">
            <div className="flex items-center gap-3 p-6 border-b border-white/80">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-700">
                  Quick Setup
                </h2>
                <p className="text-sm text-slate-500">
                  Copy this template to your{' '}
                  <code className="bg-white/40 px-2 py-0.5 rounded text-blue-600 text-xs font-mono">
                    .env.local
                  </code>{' '}
                  file
                </p>
              </div>
              <div className="ml-auto">
                <CopyButton text={generateEnvTemplate()} />
              </div>
            </div>
            <div className="p-6">
              <pre className="bg-transparent text-slate-600 p-4 rounded-xl text-xs overflow-x-auto border border-white/80 font-mono leading-relaxed max-h-64 overflow-y-auto">
                <code>{generateEnvTemplate()}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Environment Variable Sections */}
        {envVarSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center`}
              >
                <section.icon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700">
                {section.title}
              </h2>
              <span
                className={`px-3 py-1 ${section.badgeColor} text-sm font-medium rounded-full`}
              >
                {section.vars.length} vars
              </span>
            </div>
            <p className="text-slate-500 mb-6 ml-[52px]">
              {section.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.vars.map((envVar, varIndex) => (
                <div
                  key={varIndex}
                  className="group glass-card p-6 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        <KeyRound className="w-4 h-4 text-white" />
                      </div>
                      {envVar.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <CopyButton
                      text={`${envVar.name}=${envVar.example}`}
                    />
                  </div>

                  <code className="text-sm font-mono text-blue-600 font-semibold block mb-2 break-all">
                    {envVar.name}
                  </code>

                  <p className="text-sm text-slate-500 mb-3">
                    {envVar.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono bg-transparent px-2 py-1 rounded">
                      {envVar.example}
                    </span>
                    {envVar.link && (
                      <a
                        href={envVar.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1 font-medium"
                      >
                        Get Key
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Important Notes */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="glass-card overflow-hidden">
            <div className="flex items-center gap-3 p-6 border-b border-white/80">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-700">
                Important Notes
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    text: 'Variables with NEXT_PUBLIC_ prefix are exposed to the browser',
                    highlight: 'NEXT_PUBLIC_',
                  },
                  {
                    text: 'Keep API keys secure and never commit them to version control',
                    highlight: null,
                  },
                  {
                    text: 'Only configure the services you want to use',
                    highlight: null,
                  },
                  {
                    text: 'The system automatically falls back to available services',
                    highlight: null,
                  },
                  {
                    text: 'Restart your dev server after changing environment variables',
                    highlight: null,
                  },
                  {
                    text: 'For production, use your hosting platform environment settings',
                    highlight: null,
                  },
                ].map((note, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-600 text-xs font-bold">
                        {i + 1}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {note.highlight ? (
                        <>
                          Variables with{' '}
                          <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-700 text-xs font-mono">
                            {note.highlight}
                          </code>{' '}
                          prefix are exposed to the browser
                        </>
                      ) : (
                        note.text
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* File Structure */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="glass-card overflow-hidden">
            <div className="flex items-center gap-3 p-6 border-b border-white/80">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-700">
                File Structure
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">
                Create these files in your project root:
              </p>
              <div className="bg-transparent rounded-xl border border-white/80 p-5 font-mono text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-slate-700">
                    /frontend/
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <FileCode className="w-4 h-4 text-green-500" />
                  <span className="text-slate-600">.env.local</span>
                  <span className="text-slate-400 text-xs ml-2">
                    Your actual API keys (DO NOT COMMIT)
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <FileCode className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-600">.env.example</span>
                  <span className="text-slate-400 text-xs ml-2">
                    Template file (safe to commit)
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-slate-700">
                    /backend/
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <FileCode className="w-4 h-4 text-green-500" />
                  <span className="text-slate-600">.env.local</span>
                  <span className="text-slate-400 text-xs ml-2">
                    Backend environment variables
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <FileCode className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-600">.env.example</span>
                  <span className="text-slate-400 text-xs ml-2">
                    Backend template file
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="neu-hero rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg opacity-90 mb-8">
              Once configured, explore our AI agents and powerful developer
              tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://mumtaz.ai/agents"
                className="btn-primary bg-white text-blue-600 hover:bg-transparent inline-flex items-center gap-2"
              >
                Explore AI Agents
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tools"
                className="btn-primary border-2 border-white bg-transparent hover:bg-white hover:text-blue-600 inline-flex items-center gap-2"
              >
                Developer Tools
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
