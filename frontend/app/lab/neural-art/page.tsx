'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { Palette, Upload, Download, Wand2, RefreshCw, Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function NeuralArtPage() {
  const [selectedStyle, setSelectedStyle] = useState('van-gogh')
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)

  const styles = [
    { 
      id: 'van-gogh', 
      name: 'Van Gogh', 
      preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/300px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
      description: 'Swirling brushstrokes'
    },
    { 
      id: 'picasso', 
      name: 'Picasso', 
      preview: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Pablo_Picasso%2C_1910%2C_Girl_with_a_Mandolin_%28Fanny_Tellier%29%2C_oil_on_canvas%2C_100.3_x_73.6_cm%2C_Museum_of_Modern_Art_New_York..jpg/220px-Pablo_Picasso%2C_1910%2C_Girl_with_a_Mandolin_%28Fanny_Tellier%29%2C_oil_on_canvas%2C_100.3_x_73.6_cm%2C_Museum_of_Modern_Art_New_York..jpg',
      description: 'Cubist geometric'
    },
    { 
      id: 'monet', 
      name: 'Monet', 
      preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/300px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg',
      description: 'Soft impressionism'
    },
    { 
      id: 'kandinsky', 
      name: 'Kandinsky', 
      preview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Vassily_Kandinsky%2C_1913_-_Composition_7.jpg/300px-Vassily_Kandinsky%2C_1913_-_Composition_7.jpg',
      description: 'Bold abstract'
    },
    { 
      id: 'dali', 
      name: 'Dalí', 
      preview: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/dd/The_Persistence_of_Memory.jpg/300px-The_Persistence_of_Memory.jpg',
      description: 'Surreal dreamlike'
    },
    { 
      id: 'warhol', 
      name: 'Warhol', 
      preview: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&h=200&fit=crop',
      description: 'Pop art bold'
    },
    { 
      id: 'abstract', 
      name: 'Abstract', 
      preview: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&h=200&fit=crop',
      description: 'Modern shapes'
    },
    { 
      id: 'watercolor', 
      name: 'Watercolor', 
      preview: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=200&h=200&fit=crop',
      description: 'Soft flowing'
    }
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
        setResultImage(null) // Clear previous result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTransform = async () => {
    if (!uploadedImage) {
      alert('Please upload an image first!')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/lab/neural-art', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          style: selectedStyle
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setResultImage(data.image)
      } else {
        alert('Failed to transform image. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsProcessing(false)
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
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
                <Palette className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white">
                  Neural Art Studio
                </h1>
                <p className="text-xl text-blue-100 mt-2">
                  Transform photos into masterpieces with AI style transfer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-blue-100">256 users active</span>
              </div>
              <div className="text-sm text-blue-200">•</div>
              <div className="text-sm text-blue-100">9,840 artworks created</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upload & Original */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Upload className="w-6 h-6 text-orange-500" />
              Original Image
            </h2>

            {uploadedImage ? (
              <div className="aspect-square rounded-xl overflow-hidden mb-6">
                <Image src={uploadedImage} alt="Uploaded" fill className="object-cover" />
              </div>
            ) : (
              <label className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 mb-6 cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center px-4">Click to upload or drag & drop</p>
                <p className="text-sm mt-2">PNG, JPG up to 10MB</p>
              </label>
            )}

            {uploadedImage && (
              <button
                onClick={() => setUploadedImage(null)}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-xl font-semibold transition-all text-gray-700 border border-gray-200"
              >
                Upload Different Image
              </button>
            )}
          </motion.div>

          {/* Result */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Stylized Result
            </h2>

            {isProcessing ? (
              <div className="aspect-square rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
                <RefreshCw className="w-16 h-16 text-orange-500 animate-spin mb-4" />
                <p className="text-lg font-semibold text-gray-900">Applying neural style...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
              </div>
            ) : resultImage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="aspect-square rounded-xl overflow-hidden">
                  <Image src={resultImage} alt="Stylized result" fill className="object-cover" />
                </div>
                <a
                  href={resultImage}
                  download="neural-art.png"
                  className="block w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center gap-2 transition-all text-gray-700"
                >
                  <Download className="w-5 h-5" />
                  Download Artwork
                </a>
              </motion.div>
            ) : (
              <div className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <Palette className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center px-4">Your stylized artwork will appear here</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Style Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-8"
        >
          <label className="text-2xl font-bold mb-6 block flex items-center gap-2 text-gray-900">
            <Wand2 className="w-6 h-6 text-purple-500" />
            Choose Art Style
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-3 rounded-xl border-2 transition-all group ${
                  selectedStyle === style.id
                    ? 'border-orange-500 bg-orange-50 scale-105 shadow-lg shadow-orange-500/30'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 relative">
                  <Image 
                    src={style.preview} 
                    alt={style.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {selectedStyle === style.id && (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold text-center text-gray-900">{style.name}</div>
                <div className="text-xs text-gray-500 text-center mt-1">{style.description}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handleTransform}
            disabled={isProcessing || !uploadedImage}
            className="w-full mt-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl font-semibold text-lg text-white hover:shadow-lg shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Transforming...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Apply Style Transfer
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
