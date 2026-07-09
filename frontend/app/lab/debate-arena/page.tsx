'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { MessageSquare, Users, Trophy, Plus, Play, ThumbsUp, Loader2, Zap, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Derive a stable visitor ID from auth user or session cookie (no localStorage)
const getVisitorId = (authUserId?: string): string => {
  if (authUserId) return `user_${authUserId}`
  // Fallback: read session cookie value as identifier
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)session_id=([^;]+)/)
    if (match) return `session_${match[1]}`
  }
  return 'anonymous'
}

interface Debate {
  debateId: string
  topic: string
  status: string
  agent1: {
    name: string
    position: string
    avatar: string
    provider: string
    response: string
    responseTime: number
    votes: number
  }
  agent2: {
    name: string
    position: string
    avatar: string
    provider: string
    response: string
    responseTime: number
    votes: number
  }
  totalVotes: number
  viewers: number
  votedUsers: string[]
  createdAt: string
}

export default function DebateArenaPage() {
  const { state } = useAuth()
  const [debates, setDebates] = useState<Debate[]>([])
  const [activeDebate, setActiveDebate] = useState<Debate | null>(null)
  const [isDebating, setIsDebating] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const [stats, setStats] = useState({ totalDebates: 0, activeUsers: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [votedDebates, setVotedDebates] = useState<Set<string>>(new Set())

  // Stable visitor ID derived from auth state
  const visitorIdRef = useRef(getVisitorId(state.user?.id))
  useEffect(() => {
    visitorIdRef.current = getVisitorId(state.user?.id)
  }, [state.user?.id])

  // Load debates from database
  const loadDebates = useCallback(async () => {
    try {
      const res = await fetch('/api/lab/debate-arena')
      const data = await res.json()
      if (data.success) {
        setDebates(data.debates || [])
        if (data.stats) {
          setStats({
            totalDebates: data.stats.totalDebates,
            activeUsers: data.stats.activeUsers,
          })
        }
        // Check which debates we've voted on
        const visitorId = visitorIdRef.current
        const voted = new Set<string>()
        for (const debate of data.debates || []) {
          if (debate.votedUsers?.includes(visitorId)) {
            voted.add(debate.debateId)
          }
        }
        setVotedDebates(voted)
      }
    } catch (error) {
      console.error('Failed to fetch debates:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load debates on mount and refresh periodically
  useEffect(() => {
    loadDebates()
    const interval = setInterval(loadDebates, 15000) // Refresh every 15 seconds
    return () => clearInterval(interval)
  }, [loadDebates])

  // Handle voting - persisted to database
  const handleVote = async (debateId: string, vote: 'agent1' | 'agent2') => {
    if (votedDebates.has(debateId)) return

    const visitorId = visitorIdRef.current

    try {
      const res = await fetch('/api/lab/debate-arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          debateId,
          vote,
          visitorId,
        }),
      })

      const data = await res.json()
      if (data.success) {
        // Update local state
        setVotedDebates(prev => new Set([...prev, debateId]))
        
        // Update debate in list
        setDebates(prev => prev.map(d => {
          if (d.debateId === debateId) {
            return {
              ...d,
              agent1: { ...d.agent1, votes: data.votes.agent1 },
              agent2: { ...d.agent2, votes: data.votes.agent2 },
              totalVotes: data.votes.total,
              votedUsers: [...d.votedUsers, visitorId],
            }
          }
          return d
        }))

        // Update active debate if it's the one being voted on
        if (activeDebate?.debateId === debateId) {
          setActiveDebate(prev => prev ? {
            ...prev,
            agent1: { ...prev.agent1, votes: data.votes.agent1 },
            agent2: { ...prev.agent2, votes: data.votes.agent2 },
            totalVotes: data.votes.total,
            votedUsers: [...prev.votedUsers, visitorId],
          } : null)
        }
      }
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  // Submit new debate topic
  const handleSubmitTopic = async () => {
    if (!newTopic.trim() || isSubmitting) return
    
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/lab/debate-arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: newTopic.trim(),
          agent1Position: 'Pro',
          agent2Position: 'Con',
        }),
      })

      const data = await res.json()

      if (data.success && data.debate) {
        // Add new debate to list and set it as active
        setDebates(prev => [data.debate, ...prev])
        setNewTopic('')
        setActiveDebate(data.debate)
      }
    } catch (error) {
      console.error('Failed to create debate:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // View an existing debate
  const handleViewDebate = (debate: Debate) => {
    setActiveDebate(debate)
  }

  const hasVotedOnDebate = (debateId: string) => votedDebates.has(debateId)

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
              <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/25">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white">
                  AI Debate Arena
                </h1>
                <p className="text-xl text-blue-100 mt-2">
                  Watch AI agents debate and vote on winners
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-blue-100">{stats.activeUsers.toLocaleString()} users active</span>
              </div>
              <div className="text-sm text-blue-200">•</div>
              <div className="text-sm text-blue-100">{stats.totalDebates.toLocaleString()} debates hosted</div>
              <div className="text-sm text-blue-200">•</div>
              <div className="flex items-center gap-1 text-sm text-yellow-300">
                <Zap className="w-3 h-3" />
                <span>Nova vs Blaze</span>
              </div>
              <button
                onClick={loadDebates}
                className="ml-auto flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">

        {!activeDebate ? (
          <div className="space-y-8">
            {/* Submit New Topic */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                <Plus className="w-6 h-6 text-yellow-500" />
                Submit Debate Topic
              </h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Suggest a debate topic for AI agents..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitTopic()}
                />
                <button 
                  onClick={handleSubmitTopic}
                  disabled={isSubmitting || !newTopic.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl font-semibold text-white hover:shadow-lg shadow-lg shadow-yellow-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  ) : (
                    'Start Debate'
                  )}
                </button>
              </div>
            </motion.div>

            {/* Live Debates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <Trophy className="w-8 h-8 text-yellow-500" />
                Live Debates ({debates.length})
              </h2>

              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                </div>
              ) : debates.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-lg">
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-xl text-gray-600">No debates yet</p>
                  <p className="text-gray-500 mt-2">Be the first to start a debate!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {debates.map((debate, index) => (
                    <motion.div
                      key={debate.debateId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 bg-red-100 border border-red-200 rounded-full text-xs text-red-600 flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              LIVE
                            </span>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Users className="w-4 h-4" />
                              {debate.viewers || Math.floor(Math.random() * 100) + 50} watching
                            </div>
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <ThumbsUp className="w-4 h-4" />
                              {debate.totalVotes} total votes
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold mb-4 text-gray-900">{debate.topic}</h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="text-4xl mb-2 text-center">{debate.agent1.avatar}</div>
                          <div className="text-lg font-bold text-center mb-1 text-gray-900">{debate.agent1.name}</div>
                          <div className="text-xs text-center text-blue-600 mb-1">Powered by {debate.agent1.provider}</div>
                          <div className="text-sm text-center text-gray-600 mb-3">{debate.agent1.position}</div>
                          <div className="flex items-center justify-center gap-2">
                            <ThumbsUp className="w-4 h-4 text-green-500" />
                            <span className="text-xl font-bold text-green-600">{debate.agent1.votes}</span>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                          <div className="text-4xl mb-2 text-center">{debate.agent2.avatar}</div>
                          <div className="text-lg font-bold text-center mb-1 text-gray-900">{debate.agent2.name}</div>
                          <div className="text-xs text-center text-purple-600 mb-1">Powered by {debate.agent2.provider}</div>
                          <div className="text-sm text-center text-gray-600 mb-3">{debate.agent2.position}</div>
                          <div className="flex items-center justify-center gap-2">
                            <ThumbsUp className="w-4 h-4 text-green-500" />
                            <span className="text-xl font-bold text-green-600">{debate.agent2.votes}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewDebate(debate)}
                        className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl font-semibold text-lg text-white hover:shadow-lg shadow-lg shadow-yellow-500/25 transition-all flex items-center justify-center gap-3"
                      >
                        <Play className="w-5 h-5" />
                        View Debate & Vote
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg"
          >
            <button
              onClick={() => setActiveDebate(null)}
              className="mb-6 text-blue-600 hover:text-blue-700"
            >
              ← Back to debates
            </button>

            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">{activeDebate.topic}</h2>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="text-6xl mb-4">{activeDebate.agent1.avatar}</div>
                <div className="text-2xl font-bold mb-1 text-gray-900">{activeDebate.agent1.name}</div>
                <div className="text-xs text-blue-600 mb-2">Powered by {activeDebate.agent1.provider}</div>
                <div className="text-gray-600 mb-4">{activeDebate.agent1.position}</div>
                <div className="text-2xl font-bold text-green-600 mb-3">{activeDebate.agent1.votes} votes</div>
                <button 
                  onClick={() => handleVote(activeDebate.debateId, 'agent1')}
                  disabled={hasVotedOnDebate(activeDebate.debateId)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    hasVotedOnDebate(activeDebate.debateId)
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg shadow-lg shadow-blue-500/25'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  {hasVotedOnDebate(activeDebate.debateId) ? 'Already Voted' : 'Vote for Nova'}
                </button>
              </div>

              <div className="text-center p-6 bg-purple-50 border border-purple-200 rounded-2xl">
                <div className="text-6xl mb-4">{activeDebate.agent2.avatar}</div>
                <div className="text-2xl font-bold mb-1 text-gray-900">{activeDebate.agent2.name}</div>
                <div className="text-xs text-purple-600 mb-2">Powered by {activeDebate.agent2.provider}</div>
                <div className="text-gray-600 mb-4">{activeDebate.agent2.position}</div>
                <div className="text-2xl font-bold text-green-600 mb-3">{activeDebate.agent2.votes} votes</div>
                <button 
                  onClick={() => handleVote(activeDebate.debateId, 'agent2')}
                  disabled={hasVotedOnDebate(activeDebate.debateId)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    hasVotedOnDebate(activeDebate.debateId)
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg shadow-lg shadow-purple-500/25'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  {hasVotedOnDebate(activeDebate.debateId) ? 'Already Voted' : 'Vote for Blaze'}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Debate Arguments</h3>
                <span className="text-xs text-indigo-600">⚡ Nova vs 🔥 Blaze - Real-time AI Debate</span>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                  <div className="font-semibold text-blue-700 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      ⚡ {activeDebate.agent1.name}
                      <span className="text-xs px-2 py-0.5 bg-blue-100 rounded text-blue-600">{activeDebate.agent1.provider}</span>
                    </span>
                    <span className="text-xs text-gray-500">{activeDebate.agent1.responseTime}ms</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{activeDebate.agent1.response}</p>
                </div>
                <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
                  <div className="font-semibold text-purple-700 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      🚀 {activeDebate.agent2.name}
                      <span className="text-xs px-2 py-0.5 bg-purple-100 rounded text-purple-600">{activeDebate.agent2.provider}</span>
                    </span>
                    <span className="text-xs text-gray-500">{activeDebate.agent2.responseTime}ms</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{activeDebate.agent2.response}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}
