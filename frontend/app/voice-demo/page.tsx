'use client'

import { useState } from 'react'
import VoiceInput from '@/components/VoiceInput'

export default function VoiceInputDemo() {
  const [transcription, setTranscription] = useState<string>('')
  const [response, setResponse] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleTranscription = (text: string) => {
    setTranscription(text)
    console.log('Transcription:', text)
  }

  const handleResponse = (text: string) => {
    setResponse(text)
    console.log('Response:', text)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    console.error('Voice Error:', errorMessage)
  }

  return (
    <div className="min-h-screen themed-section-bg">
      {/* Hero */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-violet-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-fuchsia-300/20 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-56 h-56 bg-violet-200/25 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-block bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl px-8 py-10 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
              Enhanced Voice Input Demo
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Experience the improved voice input component with better visual feedback, 
              confirmation messages, and enhanced user experience.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Voice Input Component */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6 text-center">
              🎙️ Voice Input Component
            </h2>
            
            <VoiceInput
              onTranscription={handleTranscription}
              onResponse={handleResponse}
              onError={handleError}
              agent="demo-agent"
              voice="alloy"
              userId="demo-user"
              conversationId="demo-conversation"
              className="w-full"
            />
          </div>

          {/* Demo Results */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Transcription Display */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-blue-500 mr-2">🎯</span>
                Transcription
              </h3>
              <div className="bg-blue-50/60 backdrop-blur-sm rounded-xl p-4 min-h-[100px] border border-blue-100/50">
                {transcription ? (
                  <p className="text-blue-800 text-sm">{transcription}</p>
                ) : (
                  <p className="text-blue-400 text-sm italic">Your speech will appear here...</p>
                )}
              </div>
            </div>

            {/* Response Display */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-green-500 mr-2">🤖</span>
                AI Response
              </h3>
              <div className="bg-green-50/60 backdrop-blur-sm rounded-xl p-4 min-h-[100px] border border-green-100/50">
                {response ? (
                  <p className="text-green-800 text-sm">{response}</p>
                ) : (
                  <p className="text-green-400 text-sm italic">AI response will appear here...</p>
                )}
              </div>
            </div>

            {/* Error Display */}
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                Status & Errors
              </h3>
              <div className="bg-red-50/60 backdrop-blur-sm rounded-xl p-4 min-h-[100px] border border-red-100/50">
                {error ? (
                  <p className="text-red-800 text-sm">{error}</p>
                ) : (
                  <p className="text-red-400 text-sm italic">No errors - system ready!</p>
                )}
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-12 relative py-10 overflow-hidden rounded-[2rem] themed-section-bg">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -left-10 w-56 h-56 bg-violet-300/30 rounded-full blur-3xl" />
              <div className="absolute top-1/2 right-0 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-fuchsia-300/20 rounded-full blur-3xl" />
              <div className="absolute top-0 right-1/4 w-48 h-48 bg-indigo-300/20 rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
            </div>
            <div className="relative z-10 px-8">
            <h3 className="text-2xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6 text-center">🚀 Enhanced Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-semibold mb-2">Visual Feedback</h4>
                <p className="text-slate-600 text-sm">Real-time visual indicators show recording and processing states</p>
              </div>
              <div className="text-center bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="text-3xl mb-2">✅</div>
                <h4 className="font-semibold mb-2">Confirmation Messages</h4>
                <p className="text-slate-600 text-sm">Clear success and error messages with auto-dismiss</p>
              </div>
              <div className="text-center bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="text-3xl mb-2">🎙️</div>
                <h4 className="font-semibold mb-2">Listening Indicators</h4>
                <p className="text-slate-600 text-sm">Animated dots and pulse effects show active listening</p>
              </div>
              <div className="text-center bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold mb-2">Processing Stages</h4>
                <p className="text-slate-600 text-sm">Track progress through transcription and response generation</p>
              </div>
            </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white/30 backdrop-blur-sm border border-amber-200/60 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-4">📋 How to Test</h3>
            <div className="text-amber-700 text-sm space-y-2">
              <p><strong>1.</strong> Click the microphone button to start recording</p>
              <p><strong>2.</strong> Watch for the visual feedback: pulse animation, listening indicators, and timer</p>
              <p><strong>3.</strong> Speak clearly into your microphone</p>
              <p><strong>4.</strong> Click again to stop, or let it auto-stop</p>
              <p><strong>5.</strong> Observe the processing stages: transcribing → generating → complete</p>
              <p><strong>6.</strong> See confirmation messages and results in the panels above</p>
            </div>
          </div>

          {/* Back Navigation */}
          <div className="text-center mt-8">
            <a
              href="https://mumtaz.ai/agents"
              className="inline-flex items-center px-7 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105"
            >
              ← Back to Agents
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}