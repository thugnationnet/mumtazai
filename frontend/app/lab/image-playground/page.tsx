'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Wand2, Image as ImageIcon, Palette, Download, Share2, RefreshCw } from 'lucide-react'

export default function ImagePlaygroundPage() {
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('realistic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const styles = [
    { 
      id: 'realistic', 
      name: 'Realistic', 
      preview: 'bg-gradient-to-br from-sky-400 via-blue-300 to-green-400',
      icon: '📷'
    },
    { 
      id: 'artistic', 
      name: 'Artistic', 
      preview: 'bg-gradient-to-br from-purple-500 via-pink-400 to-yellow-300',
      icon: '🎨'
    },
    { 
      id: 'anime', 
      name: 'Anime', 
      preview: 'bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-300',
      icon: '✨'
    },
    { 
      id: 'oil-painting', 
      name: 'Oil Painting', 
      preview: 'bg-gradient-to-br from-amber-600 via-orange-400 to-yellow-500',
      icon: '🖼️'
    },
    { 
      id: 'watercolor', 
      name: 'Watercolor', 
      preview: 'bg-gradient-to-br from-cyan-300 via-blue-200 to-pink-200',
      icon: '💧'
    },
    { 
      id: 'digital-art', 
      name: 'Digital Art', 
      preview: 'bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400',
      icon: '💻'
    },
    { 
      id: '3d-render', 
      name: '3D Render', 
      preview: 'bg-gradient-to-br from-slate-600 via-indigo-500 to-blue-400',
      icon: '🎮'
    },
    { 
      id: 'pixel-art', 
      name: 'Pixel Art', 
      preview: 'bg-gradient-to-br from-green-500 via-lime-400 to-emerald-400',
      icon: '👾'
    }
  ]

  const examples = [
    'A majestic dragon soaring through a starlit galaxy',
    'Futuristic city with flying cars at sunset',
    'Enchanted forest with glowing mushrooms',
    'Cyberpunk street market with neon lights',
    'Serene mountain landscape with crystal clear lake',
    'Abstract representation of human consciousness'
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/lab/image-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: selectedStyle,
        })
      })

      if (!response.ok) {
        throw new Error('Image generation failed')
      }

      const data = await response.json()
      const imageUrl = data.image
      if (imageUrl) {
        setGeneratedImage(imageUrl)
      } else {
        throw new Error('No image URL returned')
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('Image generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImage) return
    
    try {
      let blob: Blob
      
      // Check if it's a data URL (base64)
      if (generatedImage.startsWith('data:')) {
        // Convert base64 data URL to blob directly (no fetch needed)
        const [header, base64Data] = generatedImage.split(',')
        const mimeMatch = header.match(/data:([^;]+)/)
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
        
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        blob = new Blob([byteArray], { type: mimeType })
      } else {
        // Regular URL - fetch as blob
        const response = await fetch(generatedImage)
        blob = await response.blob()
      }
      
      // Create object URL
      const url = window.URL.createObjectURL(blob)
      
      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `ai-generated-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try right-clicking the image and selecting "Save image as..."')
    }
  }

  const handleShare = async () => {
    if (!generatedImage) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Image',
          text: `Check out this image I created with AI: "${prompt}"`,
          url: generatedImage
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(generatedImage)
      alert('Image URL copied to clipboard!')
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
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/25">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white">
                  AI Image Playground
                </h1>
                <p className="text-xl text-blue-100 mt-2">
                  Generate stunning images from text descriptions with AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-blue-100">342 users active</span>
              </div>
              <div className="text-sm text-blue-200">•</div>
              <div className="text-sm text-blue-100">12,450 images generated</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Prompt Input */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-6">
              <label className="flex items-center gap-2 text-lg font-semibold mb-4 text-gray-900">
                <Wand2 className="w-5 h-5 text-purple-500" />
                Your Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
              
              {/* Example Prompts */}
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">Try these examples:</div>
                <div className="flex flex-wrap gap-2">
                  {examples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="text-xs px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 hover:border-purple-300 transition-all text-gray-700"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Style Selection */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-6">
              <label className="flex items-center gap-2 text-lg font-semibold mb-4 text-gray-900">
                <Palette className="w-5 h-5 text-pink-500" />
                Art Style
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedStyle === style.id
                        ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className={`w-full h-14 rounded-lg ${style.preview} mb-2 flex items-center justify-center text-2xl shadow-inner`}>
                      {style.icon}
                    </div>
                    <div className="text-sm font-medium text-center text-gray-900">{style.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg text-white hover:shadow-lg shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Right Panel - Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <label className="flex items-center gap-2 text-lg font-semibold mb-4 text-gray-900">
              <ImageIcon className="w-5 h-5 text-cyan-500" />
              Generated Image
            </label>

            {/* Preview Area */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200 mb-4">
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <RefreshCw className="w-16 h-16 text-purple-500 animate-spin mb-4" />
                  <div className="text-lg font-semibold text-gray-900">Creating your masterpiece...</div>
                  <div className="text-sm text-gray-500 mt-2">This may take a few seconds</div>
                </div>
              ) : generatedImage ? (
                <motion.img
                  key={generatedImage}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                  <div className="text-lg">Your generated image will appear here</div>
                  <div className="text-sm mt-2">Enter a prompt and click Generate</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {generatedImage && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                <button 
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-all text-gray-700"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
                <button 
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-all text-gray-700"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </motion.div>
            )}

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-sm text-blue-700">
                <strong>💡 Pro Tip:</strong> Be specific in your prompts! Include details about lighting, mood, colors, and composition for better results.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
