'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { Music, Play, Pause, Download, RefreshCw, Sliders } from 'lucide-react'

export default function MusicGeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedMusic, setGeneratedMusic] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [genre, setGenre] = useState('electronic')
  const [mood, setMood] = useState('energetic')
  const [duration, setDuration] = useState(30)

  const genres = ['Electronic', 'Rock', 'Jazz', 'Classical', 'Hip Hop', 'Ambient', 'Pop', 'Cinematic']
  const moods = ['Energetic', 'Calm', 'Dark', 'Uplifting', 'Mysterious', 'Romantic']

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please describe the music you want to create')
      return
    }
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/lab/music-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          genre,
          mood,
          duration
        })
      })

      if (!response.ok) {
        throw new Error('Music generation failed')
      }

      const data = await response.json()
      setGeneratedMusic(data.audio)
    } catch (error) {
      console.error('Music generation error:', error)
      alert('Music generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

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
            <Link href="/lab" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-700 mb-6">
              <span>←</span> Back to AI Lab
            </Link>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                <Music className="w-12 h-12 text-purple-600" />
              </div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">
                  AI Music Generator
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Create original music and soundtracks from text
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-600">143 users active</span>
              </div>
              <div className="text-sm text-slate-400">•</div>
              <div className="text-sm text-slate-600">6,730 tracks created</div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg">
              <label className="text-lg font-semibold mb-4 block text-gray-900">Describe Your Music</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Epic orchestral soundtrack with powerful drums and soaring strings..."
                className="w-full h-32 bg-white/60 border border-white/60 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg">
                <label className="text-lg font-semibold mb-4 block flex items-center gap-2 text-gray-900">
                  <Music className="w-5 h-5 text-cyan-500" />
                  Genre
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {genres.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenre(g.toLowerCase())}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        genre === g.toLowerCase()
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-500 text-white'
                          : 'bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg">
                <label className="text-lg font-semibold mb-4 block flex items-center gap-2 text-gray-900">
                  <Sliders className="w-5 h-5 text-purple-500" />
                  Mood
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {moods.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(m.toLowerCase())}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        mood === m.toLowerCase()
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-500 text-white'
                          : 'bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg">
              <label className="text-lg font-semibold mb-4 block text-gray-900">Duration: {duration} seconds</label>
              <input
                type="range"
                min="15"
                max="60"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold text-lg text-white hover:shadow-lg shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Composing Music...
                </>
              ) : (
                <>
                  <Music className="w-5 h-5" />
                  Generate Music
                </>
              )}
            </button>
          </motion.div>

          {/* Player */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg"
          >
            <h3 className="text-xl font-bold mb-6 text-gray-900">Your Track</h3>

            {generatedMusic && !isGenerating ? (
              <div className="space-y-6">
                <div className="aspect-square rounded-xl bg-white/40 border border-white/60 shadow-lg flex items-center justify-center">
                  <Music className="w-24 h-24 opacity-80 text-purple-600" />
                </div>

                <div className="space-y-3">
                  <audio src={generatedMusic} controls className="w-full mb-3" />
                  
                  <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center gap-2 transition-all text-gray-700">
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <Music className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center px-4">
                  {isGenerating ? 'Creating your track...' : 'Your generated music will appear here'}
                </p>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  )
}
