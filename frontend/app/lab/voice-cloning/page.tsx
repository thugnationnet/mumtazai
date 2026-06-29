'use client';

import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Mic,
  Play,
  Square,
  Download,
  Wand2,
  Volume2,
  RefreshCw,
} from 'lucide-react';

export default function VoiceCloningPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [text, setText] = useState('');
  const [clonedAudio, setClonedAudio] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM'); // Rachel default
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasRecording(true);
    } else {
      setIsRecording(true);
      setHasRecording(false);
    }
  };

  const handleClone = async () => {
    if (!text.trim()) {
      alert('Please enter text to generate speech');
      return;
    }

    setIsCloning(true);

    try {
      const response = await fetch('/api/lab/voice-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice,
          stability: 0.5,
          similarityBoost: 0.75,
        }),
      });

      if (!response.ok) {
        throw new Error('Voice generation failed');
      }

      const data = await response.json();
      setClonedAudio(data.audio);
    } catch (error) {
      console.error('Voice cloning error:', error);
      alert('Voice generation failed. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleDownloadAudio = () => {
    if (!clonedAudio) return;
    
    try {
      // Create a link element
      const link = document.createElement('a');
      link.href = clonedAudio;
      link.download = `cloned-voice-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download audio');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass Pillars */}
        <div className="absolute top-0 left-[8%] w-24 h-full bg-gradient-to-b from-white/30 via-purple-200/20 to-transparent rounded-full blur-sm transform -skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[25%] w-16 h-full bg-gradient-to-b from-white/25 via-indigo-200/15 to-transparent rounded-full blur-sm transform skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[20%] w-20 h-full bg-gradient-to-b from-white/30 via-purple-100/20 to-transparent rounded-full blur-sm transform -skew-x-2 pointer-events-none" />
        <div className="absolute top-0 right-[8%] w-14 h-full bg-gradient-to-b from-white/20 via-indigo-100/15 to-transparent rounded-full blur-sm transform skew-x-3 pointer-events-none" />
        <div className="absolute top-0 left-[50%] w-12 h-full bg-gradient-to-b from-white/15 via-purple-200/10 to-transparent rounded-full blur-sm pointer-events-none" />
        {/* Chrome Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />

        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/lab"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-700 mb-6"
            >
              <span>←</span> Back to AI Lab
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                <Mic className="w-12 h-12 text-purple-600" />
              </div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
                  Voice Cloning Studio
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Clone your voice and create custom speech with AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-600">198 users active</span>
              </div>
              <div className="text-sm text-slate-400">•</div>
              <div className="text-sm text-slate-600">8,920 voices cloned</div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recording Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Mic className="w-6 h-6 text-purple-500" />
              Step 1: Record Your Voice
            </h2>

            <div className="text-center py-12">
              {isRecording ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-6"
                >
                  <Mic className="w-16 h-16 text-white" />
                </motion.div>
              ) : (
                <div className="w-32 h-32 mx-auto rounded-full bg-white/40 border border-white/60 shadow-lg flex items-center justify-center mb-6">
                  <Mic className="w-16 h-16 text-purple-600" />
                </div>
              )}

              <button
                onClick={handleRecord}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all text-white ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg shadow-lg shadow-purple-500/25'
                }`}
              >
                {isRecording ? (
                  <span className="flex items-center gap-2">
                    <Square className="w-5 h-5" />
                    Stop Recording
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </span>
                )}
              </button>

              {hasRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-green-600 flex items-center justify-center gap-2"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Recording saved!
                </motion.div>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
              <strong>💡 Tip:</strong> Record 10-15 seconds of clear speech for
              best results. Speak naturally and clearly.
            </div>
          </motion.div>

          {/* Text-to-Speech Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-white/60 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Wand2 className="w-6 h-6 text-indigo-500" />
              Step 2: Generate Speech
            </h2>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want your cloned voice to say..."
              className="w-full h-48 bg-white/60 border border-white/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none mb-6"
            />

            <button
              onClick={handleClone}
              disabled={!text.trim() || isCloning}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-semibold text-lg text-white hover:shadow-lg shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6"
            >
              {isCloning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating Voice...
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  Generate Speech
                </>
              )}
            </button>

            {clonedAudio && !isCloning && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-gray-900">Cloned Audio</span>
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Ready
                    </div>
                  </div>
                  <audio ref={audioRef} controls className="w-full mb-4" src={clonedAudio}>
                    Your browser does not support the audio element.
                  </audio>
                  <button 
                    onClick={handleDownloadAudio}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center gap-2 transition-all text-gray-700"
                  >
                    <Download className="w-5 h-5" />
                    Download Audio
                  </button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 mt-4"
                >
                  <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-semibold text-gray-900">
                        Voice cloned successfully!
                      </span>
                    </div>
                    <button 
                      onClick={handlePlayAudio}
                      className="w-full py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center gap-2 transition-all text-gray-700"
                    >
                      <Play className="w-5 h-5" />
                      Play Cloned Voice
                    </button>
                  </div>

                  <button 
                    onClick={handleDownloadAudio}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center gap-2 transition-all text-gray-700"
                  >
                    <Download className="w-5 h-5" />
                    Download Audio
                  </button>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
