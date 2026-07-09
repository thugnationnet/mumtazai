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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-brand-600 to-accent-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>
        <div className="container mx-auto px-4 py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/lab" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-6">
              <span>←</span> Back to AI Lab
            </Link>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                <Music className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white">
                  AI Music Generator
                </h1>
                <p className="text-xl text-blue-100 mt-2">
                  Create original music and soundtracks from text
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-blue-100">143 users active</span>
              </div>
              <div className="text-sm text-blue-200">•</div>
              <div className="text-sm text-blue-100">6,730 tracks created</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <label className="text-lg font-semibold mb-4 block text-gray-900">Describe Your Music</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Epic orchestral soundtrack with powerful drums and soaring strings..."
                className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
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

              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
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

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
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
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <h3 className="text-xl font-bold mb-6 text-gray-900">Your Track</h3>

            {generatedMusic && !isGenerating ? (
              <div className="space-y-6">
                <div className="aspect-square rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 flex items-center justify-center">
                  <Music className="w-24 h-24 opacity-80 text-white" />
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
