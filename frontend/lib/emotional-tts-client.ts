/**
 * EMOTIONAL TTS CLIENT
 * Frontend client for emotional text-to-speech
 */

import { EmotionalTTSConfig, Emotion, SpeakingStyle, VoicePersonality } from '@/lib/emotional-tts-service'

export interface EmotionalTTSClientConfig {
  baseUrl?: string
  autoPlay?: boolean
}

export class EmotionalTTSClient {
  private baseUrl: string
  private audioCache: Map<string, string> = new Map()
  private currentAudio: HTMLAudioElement | null = null

  constructor(config?: EmotionalTTSClientConfig) {
    this.baseUrl = config?.baseUrl || '/api/emotional-tts'
  }

  /**
   * Generate emotional speech
   */
  async speak(
    text: string,
    agentId: string,
    config?: Partial<EmotionalTTSConfig>
  ): Promise<{
    audioUrl: string
    provider: string
    emotion: Emotion
    style: SpeakingStyle
    cost?: number
  }> {
    // Check cache
    const cacheKey = `${agentId}:${text}:${JSON.stringify(config)}`
    if (this.audioCache.has(cacheKey)) {
      return {
        audioUrl: this.audioCache.get(cacheKey)!,
        provider: 'cache',
        emotion: config?.emotion || 'neutral',
        style: config?.style || 'conversational'
      }
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'speak',
        text,
        agentId,
        config
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || 'TTS generation failed')
    }

    const result = await response.json()
    const { audio, provider, emotion, style, cost } = result.data

    // Convert base64 to blob URL
    const audioBlob = this.base64ToBlob(audio, 'audio/mpeg')
    const audioUrl = URL.createObjectURL(audioBlob)

    // Cache the audio URL
    this.audioCache.set(cacheKey, audioUrl)

    return { audioUrl, provider, emotion, style, cost }
  }

  /**
   * Speak and play audio immediately
   */
  async speakAndPlay(
    text: string,
    agentId: string,
    config?: Partial<EmotionalTTSConfig>
  ): Promise<void> {
    const result = await this.speak(text, agentId, config)
    await this.playAudio(result.audioUrl)
  }

  /**
   * Quick speak with emotion detection
   */
  async quickSpeak(text: string, agentId: string): Promise<string> {
    const result = await this.speak(text, agentId)
    return result.audioUrl
  }

  /**
   * Play audio URL
   */
  async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop current audio if playing
      if (this.currentAudio) {
        this.currentAudio.pause()
        this.currentAudio = null
      }

      const audio = new Audio(audioUrl)
      this.currentAudio = audio

      audio.onended = () => {
        this.currentAudio = null
        resolve()
      }

      audio.onerror = (error) => {
        this.currentAudio = null
        reject(error)
      }

      audio.play().catch(reject)
    })
  }

  /**
   * Stop current audio
   */
  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio = null
    }
  }

  /**
   * Test TTS for an agent
   */
  async testTTS(agentId: string): Promise<{
    audioUrl: string
    provider: string
    emotion: Emotion
    style: SpeakingStyle
  }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test',
        agentId
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || 'TTS test failed')
    }

    const result = await response.json()
    const { audio, provider, emotion, style } = result.data

    const audioBlob = this.base64ToBlob(audio, 'audio/mpeg')
    const audioUrl = URL.createObjectURL(audioBlob)

    return { audioUrl, provider, emotion, style }
  }

  /**
   * Get available providers for an agent
   */
  async getAvailableProviders(agentId: string): Promise<string[]> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'providers',
        agentId
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get providers')
    }

    const result = await response.json()
    return result.providers
  }

  /**
   * Get agent personality
   */
  async getPersonality(agentId: string): Promise<VoicePersonality> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'personality',
        agentId
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get personality')
    }

    const result = await response.json()
    return result.personality
  }

  /**
   * Get all configured agents
   */
  async getAllAgents(): Promise<string[]> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'agents'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get agents')
    }

    const result = await response.json()
    return result.agents
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    // Revoke all blob URLs to prevent memory leaks
    this.audioCache.forEach(url => URL.revokeObjectURL(url))
    this.audioCache.clear()
  }

  // Helper methods
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }
}

// ============================================
// REACT HOOKS
// ============================================

import { useState, useCallback, useEffect } from 'react'

export function useEmotionalTTS(agentId: string) {
  const [client] = useState(() => new EmotionalTTSClient())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const speak = useCallback(async (
    text: string,
    config?: Partial<EmotionalTTSConfig>
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await client.speak(text, agentId, config)
      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [client, agentId])

  const speakAndPlay = useCallback(async (
    text: string,
    config?: Partial<EmotionalTTSConfig>
  ) => {
    setLoading(true)
    setError(null)
    setIsPlaying(true)
    
    try {
      await client.speakAndPlay(text, agentId, config)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
      setIsPlaying(false)
    }
  }, [client, agentId])

  const stop = useCallback(() => {
    client.stopAudio()
    setIsPlaying(false)
  }, [client])

  const test = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await client.testTTS(agentId)
      await client.playAudio(result.audioUrl)
      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [client, agentId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      client.clearCache()
    }
  }, [client])

  return {
    speak,
    speakAndPlay,
    stop,
    test,
    loading,
    error,
    isPlaying
  }
}

/**
 * Hook for getting agent personality
 */
export function useAgentPersonality(agentId: string) {
  const [client] = useState(() => new EmotionalTTSClient())
  const [personality, setPersonality] = useState<VoicePersonality | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPersonality() {
      try {
        const data = await client.getPersonality(agentId)
        setPersonality(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPersonality()
  }, [client, agentId])

  return { personality, loading, error }
}

/**
 * Hook for getting available providers
 */
export function useAvailableProviders(agentId: string) {
  const [client] = useState(() => new EmotionalTTSClient())
  const [providers, setProviders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const data = await client.getAvailableProviders(agentId)
        setProviders(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [client, agentId])

  return { providers, loading, error }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const emotionalTTSClient = new EmotionalTTSClient()
