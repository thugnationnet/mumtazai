'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ScanLine, Camera, ArrowLeft, Copy, Check, XCircle } from 'lucide-react'

export default function QrScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [result, setResult] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)

  const startScanning = async () => {
    setError('')
    setResult('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setScanning(true)
        scanFrame()
      }
    } catch {
      setError('Camera access denied or not available')
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    cancelAnimationFrame(animFrameRef.current)
    setScanning(false)
  }

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    try {
      // Use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        detector.detect(canvas).then((barcodes: any[]) => {
          if (barcodes.length > 0) {
            setResult(barcodes[0].rawValue)
            stopScanning()
            return
          }
          animFrameRef.current = requestAnimationFrame(scanFrame)
        }).catch(() => {
          animFrameRef.current = requestAnimationFrame(scanFrame)
        })
      } else {
        animFrameRef.current = requestAnimationFrame(scanFrame)
      }
    } catch {
      animFrameRef.current = requestAnimationFrame(scanFrame)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setResult('')

    const img = new Image()
    img.onload = async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
          const barcodes = await detector.detect(canvas)
          if (barcodes.length > 0) {
            setResult(barcodes[0].rawValue)
          } else {
            setError('No QR code found in image')
          }
        } catch {
          setError('QR code detection failed. Try a clearer image.')
        }
      } else {
        setError('BarcodeDetector API not supported in this browser. Try Chrome or Edge.')
      }
    }
    img.src = URL.createObjectURL(file)
  }

  useEffect(() => {
    return () => stopScanning()
  }, [])

  const copy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="min-h-screen themed-section-bg">
      <div className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="container-custom relative z-10">
          <Link href="/tools" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-500 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Tools
          </Link>
          <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg">
                <ScanLine className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">QR Code <span className="text-slate-500">Scanner</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Scan QR codes using your webcam or upload an image</p>
          </div>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Scanner Controls */}
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
            <div className="flex gap-3 mb-4">
              {!scanning ? (
                <button onClick={startScanning} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
                  <Camera className="w-5 h-5" />Start Camera
                </button>
              ) : (
                <button onClick={stopScanning} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2">
                  <XCircle className="w-5 h-5" />Stop
                </button>
              )}
              <label className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer">
                Upload Image
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <video ref={videoRef} className={`w-full ${scanning ? '' : 'hidden'}`} playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              {!scanning && !result && !error && (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <p>Camera preview will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 flex items-center gap-2">
              <XCircle className="w-5 h-5 flex-shrink-0" />{error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Decoded Result</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 break-all font-mono text-sm text-gray-900 mb-4">
                {result}
              </div>
              <div className="flex gap-3">
                <button onClick={copy} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}
                </button>
                {result.startsWith('http') && (
                  <a href={result} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Open Link
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
