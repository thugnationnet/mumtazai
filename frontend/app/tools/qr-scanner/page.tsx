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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 py-12">
        <div className="container-custom">
          <Link href="/tools" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Tools
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <ScanLine className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">QR Code <span className="text-blue-100">Scanner</span></h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Scan QR codes using your webcam or upload an image</p>
          </div>
        </div>
      </div>

      <main className="container-custom py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Scanner Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            <div className="flex gap-3 mb-4">
              {!scanning ? (
                <button onClick={startScanning} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-2">
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Decoded Result</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 break-all font-mono text-sm text-gray-900 mb-4">
                {result}
              </div>
              <div className="flex gap-3">
                <button onClick={copy} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}
                </button>
                {result.startsWith('http') && (
                  <a href={result} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors">
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
