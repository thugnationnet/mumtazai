'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Swords, Trophy, Zap, Clock, MessageSquare, ThumbsUp, Users, BarChart3, Award, Shield, Star } from 'lucide-react'
import type { BattleStats, BattleRecord, BattleLeaderboard, BattleAgent, Tournament } from './battle-arena'
import { battleArenaUtils } from './battle-arena'

/* ── Skill bar ─────────────────────────────────────────── */
function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-500">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }}
          className="h-full rounded-full" style={{ background: battleArenaUtils.getSkillLevelColor(value) }} />
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────── */
interface BattleResponse { text: string; responseTime: number; tokens: number }
interface RoundResult { round: number; model1Response: BattleResponse; model2Response: BattleResponse; winner: string | null }

type Tab = 'battle' | 'agents' | 'leaderboard' | 'history' | 'tournaments'

export default function BattleArenaPage() {
  const [tab, setTab] = useState<Tab>('battle')
  const [prompt, setPrompt] = useState('')
  const [model1, setModel1] = useState('')
  const [model2, setModel2] = useState('')
  const [currentRound, setCurrentRound] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [roundResults, setRoundResults] = useState<RoundResult[]>([])
  const [showResults, setShowResults] = useState(false)

  // Service-file state
  const [userStats, setUserStats] = useState<BattleStats | null>(null)
  const [pastBattles, setPastBattles] = useState<BattleRecord[]>([])
  const [leaderboard, setLeaderboard] = useState<BattleLeaderboard[]>([])
  const [agents, setAgents] = useState<BattleAgent[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  // Fetch all service data on mount
  useEffect(() => {
    const userId = 'current-user'
    Promise.all([
      fetch(`/api/lab/battle-arena/stats/${userId}`).then(r => r.ok ? r.json() : { stats: null }),
      fetch(`/api/lab/battle-arena/history/${userId}`).then(r => r.ok ? r.json() : { history: [] }),
      fetch('/api/lab/battle-arena/leaderboard').then(r => r.ok ? r.json() : { leaderboard: [] }),
      fetch('/api/lab/battle-arena/agents').then(r => r.ok ? r.json() : { agents: [] }),
      fetch('/api/lab/battle-arena/tournaments').then(r => r.ok ? r.json() : { tournaments: [] }),
    ]).then(([statsData, historyData, lbData, agentsData, tournData]) => {
      setUserStats(statsData.stats)
      setPastBattles(historyData.history || [])
      setLeaderboard(lbData.leaderboard || [])
      setAgents(agentsData.agents || [])
      setTournaments(tournData.tournaments || [])
    }).catch(console.error)
  }, [])

  /* ── model helpers ── */
  const models = [
    { id: 'gpt-4', name: 'Alpha', color: 'from-green-500 to-emerald-500', icon: '🤖', description: 'Creative powerhouse' },
    { id: 'claude-3', name: 'Nova', color: 'from-orange-500 to-amber-500', icon: '🧠', description: 'Deep reasoning specialist' },
    { id: 'gemini', name: 'Quantum', color: 'from-blue-500 to-cyan-500', icon: '✨', description: 'Multimodal intelligence' },
    { id: 'mistral', name: 'Pulse', color: 'from-purple-500 to-pink-500', icon: '⚡', description: 'Speed-optimized AI' },
  ]
  const getModelColor = (id: string) => models.find(m => m.id === id)?.color || 'from-gray-500 to-gray-600'
  const getModelName = (id: string) => models.find(m => m.id === id)?.name || id
  const getModelIcon = (id: string) => models.find(m => m.id === id)?.icon || '🤖'

  /* ── battle flow ── */
  const handleStartBattle = async () => {
    if (!prompt || !model1 || !model2 || model1 === model2) return
    setIsLoading(true); setShowResults(false)
    try {
      const res = await fetch('/api/lab/battle-arena', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, model1, model2, round: currentRound }) })
      if (!res.ok) throw new Error('Battle request failed')
      const data = await res.json()
      const result: RoundResult = { round: currentRound, model1Response: { text: data.model1?.response || data.model1?.text || '', responseTime: data.model1?.responseTime || 0, tokens: data.model1?.tokens || 0 }, model2Response: { text: data.model2?.response || data.model2?.text || '', responseTime: data.model2?.responseTime || 0, tokens: data.model2?.tokens || 0 }, winner: null }
      setRoundResults(prev => [...prev, result]); setShowResults(true)
    } catch { alert('Battle failed! Please try again.') }
    finally { setIsLoading(false) }
  }

  const handleVote = (idx: number, winner: string) => {
    const updated = [...roundResults]; updated[idx].winner = winner; setRoundResults(updated)
    if (currentRound === 3) {
      const w1 = updated.filter(r => r.winner === model1).length
      const w2 = updated.filter(r => r.winner === model2).length
      setTimeout(() => alert(`🏆 Battle Complete!\n\n${getModelName(model1)}: ${w1} wins\n${getModelName(model2)}: ${w2} wins\n\nWinner: ${w1 > w2 ? getModelName(model1) : w2 > w1 ? getModelName(model2) : 'Draw!'}`), 500)
    } else { setCurrentRound(c => c + 1); setShowResults(false); setPrompt('') }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'battle', label: 'Battle', icon: <Swords className="w-4 h-4" /> },
    { id: 'agents', label: 'Agents', icon: <Shield className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> },
    { id: 'tournaments', label: 'Tournaments', icon: <Award className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-brand-600 to-accent-600 overflow-hidden">
        <div className="container mx-auto px-4 py-12 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link href="/lab" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4"><span>←</span> Back to AI Lab</Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg"><Swords className="w-10 h-10 text-white" /></div>
              <div>
                <h1 className="text-4xl font-bold text-white">AI Battle Arena</h1>
                <p className="text-blue-100 mt-1">Pit the world&apos;s best AI models against each other</p>
              </div>
            </div>

            {/* Stats ribbon */}
            {userStats && (
              <div className="flex flex-wrap gap-6 mt-4">
                {[
                  { label: 'Battles', value: userStats.battlesTotal },
                  { label: 'Win Rate', value: battleArenaUtils.formatWinRate(userStats.winRate) },
                  { label: 'Streak', value: `${userStats.currentStreak} 🔥` },
                  { label: 'Ranking', value: userStats.ranking || '—' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-blue-200">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* ═══ BATTLE TAB ═══ */}
        {tab === 'battle' && (
          <>
            {/* Round indicator */}
            <div className="flex items-center gap-3 mb-6">
              {[1,2,3].map(r => (
                <div key={r} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 text-sm ${r < currentRound ? 'bg-green-500 border-green-400 text-white' : r === currentRound ? 'bg-gradient-to-r from-orange-500 to-red-500 border-yellow-400 text-white animate-pulse' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                  {r < currentRound ? '✓' : r}
                </div>
              ))}
              <span className="text-gray-500 text-sm">Round <span className="font-bold text-gray-900">{currentRound}</span>/3</span>
            </div>

            {/* Model selection + prompt */}
            {!showResults && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {['Player 1', 'Player 2'].map((label, pi) => {
                    const selected = pi === 0 ? model1 : model2
                    const other = pi === 0 ? model2 : model1
                    const setter = pi === 0 ? setModel1 : setModel2
                    const accent = pi === 0 ? 'green' : 'blue'
                    return (
                      <div key={label} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900"><Trophy className={`w-5 h-5 text-${accent}-500`} />{label}</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {models.map(m => (
                            <button key={m.id} onClick={() => setter(m.id)} disabled={other === m.id}
                              className={`p-3 rounded-xl border-2 transition-all text-left ${selected === m.id ? `border-${accent}-500 bg-${accent}-50 scale-[1.02]` : other === m.id ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed' : 'border-gray-200 hover:border-gray-300'}`}>
                              <div className="text-2xl mb-1">{m.icon}</div>
                              <div className="font-semibold text-sm text-gray-900">{m.name}</div>
                              <div className="text-xs text-gray-500">{m.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-6">
                  <label className="flex items-center gap-2 font-semibold mb-3 text-gray-900"><MessageSquare className="w-4 h-4 text-purple-500" />Battle Prompt (Round {currentRound})</label>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter your challenge..." className="w-full h-28 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none" />
                  <button onClick={handleStartBattle} disabled={!prompt || !model1 || !model2 || isLoading}
                    className="w-full mt-3 py-3 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-xl font-semibold text-white shadow-lg shadow-orange-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isLoading ? <><Zap className="w-4 h-4 animate-spin" />Battle in Progress...</> : <><Swords className="w-4 h-4" />Start Battle Round {currentRound}!</>}
                  </button>
                </div>
              </>
            )}

            {/* Battle results */}
            <AnimatePresence>
              {showResults && roundResults[currentRound - 1] && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[{ key: model1, resp: roundResults[currentRound - 1].model1Response }, { key: model2, resp: roundResults[currentRound - 1].model2Response }].map(({ key, resp }) => (
                    <div key={key} className={`bg-gradient-to-br ${getModelColor(key)} p-[2px] rounded-2xl shadow-lg`}>
                      <div className="bg-white rounded-2xl p-5 h-full">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{getModelIcon(key)}</span>
                          <div>
                            <div className="text-xl font-bold text-gray-900">{getModelName(key)}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500"><Clock className="w-3 h-3" />{resp.responseTime}ms &middot; {resp.tokens} tokens</div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 min-h-[180px] max-h-[360px] overflow-y-auto border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">{resp.text}</div>
                        <button onClick={() => handleVote(currentRound - 1, key)} disabled={roundResults[currentRound - 1].winner !== null}
                          className={`w-full py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 ${key === model1 ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                          <ThumbsUp className="w-4 h-4" />Vote for {getModelName(key)}
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* round history */}
            {roundResults.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-3 text-gray-900">Round Results</h3>
                <div className="space-y-2">
                  {roundResults.map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <span className="font-medium text-gray-900">Round {r.round}</span>
                      {r.winner ? <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium border border-yellow-200">Winner: {getModelName(r.winner)}</span> : <span className="text-gray-400 text-sm">Pending</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ AGENTS TAB ═══ */}
        {tab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <motion.div key={agent.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{agent.avatar}</span>
                  <div>
                    <div className="font-bold text-gray-900">{agent.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{agent.type} &middot; Lvl {agent.level}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-4">{agent.specialty}</div>
                <div className="space-y-2">
                  {Object.entries(agent.skills).map(([skill, val]) => (
                    <SkillBar key={skill} label={skill.charAt(0).toUpperCase() + skill.slice(1)} value={val as number} />
                  ))}
                </div>
                <button onClick={() => { setModel1(agent.id); setTab('battle') }}
                  className="w-full mt-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  Select for Battle
                </button>
              </motion.div>
            ))}
            {agents.length === 0 && <p className="text-gray-400 col-span-full text-center py-12">Loading agents...</p>}
          </div>
        )}

        {/* ═══ LEADERBOARD TAB ═══ */}
        {tab === 'leaderboard' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-yellow-500" />Global Leaderboard</h3></div>
            {leaderboard.length === 0 ? (
              <p className="text-gray-400 text-center py-12">No battles yet — be the first!</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaderboard.map((entry) => (
                  <div key={entry.rank} className={`flex items-center gap-4 px-5 py-3 ${entry.rank <= 3 ? 'bg-yellow-50/40' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${entry.rank === 1 ? 'bg-yellow-400 text-white' : entry.rank === 2 ? 'bg-gray-300 text-white' : entry.rank === 3 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{entry.rank}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{entry.username}</div>
                      <div className="text-xs text-gray-500">Rating: {entry.rating} &middot; {entry.wins}W / {entry.losses}L &middot; {entry.winRate.toFixed(0)}%</div>
                    </div>
                    {entry.rank <= 3 && <span className="text-xl">{['🥇','🥈','🥉'][entry.rank-1]}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY TAB ═══ */}
        {tab === 'history' && (
          <div className="space-y-3">
            {pastBattles.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Swords className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No battle history yet. Start your first battle!</p>
                <button onClick={() => setTab('battle')} className="mt-4 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Go to Battle</button>
              </div>
            ) : pastBattles.map((battle, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center gap-4">
                <div className={`w-2 h-10 rounded-full`} style={{ backgroundColor: battleArenaUtils.getResultColor(battle.result) }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">vs {battle.opponent}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: battleArenaUtils.getBattleTypeColor(battle.type) + '20', color: battleArenaUtils.getBattleTypeColor(battle.type) }}>{battle.type}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {battle.score} – {battle.opponentScore} &middot; {battle.rounds} round{battle.rounds !== 1 ? 's' : ''} &middot; {battleArenaUtils.formatBattleDuration(battle.duration)}
                  </div>
                </div>
                <span className="text-sm font-medium capitalize" style={{ color: battleArenaUtils.getResultColor(battle.result) }}>{battle.result}</span>
                <span className="text-xs text-gray-400">{new Date(battle.completedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* ═══ TOURNAMENTS TAB ═══ */}
        {tab === 'tournaments' && (
          <div className="space-y-4">
            {tournaments.length === 0 ? (
              <p className="text-gray-400 text-center py-12">No tournaments available right now</p>
            ) : tournaments.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white"><Award className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{t.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${t.status === 'registration' ? 'bg-green-100 text-green-700' : t.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{t.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.participants}/{t.maxParticipants}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" />{t.prize}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.rounds} rounds</span>
                      <span>Starts: {new Date(t.startTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {t.status === 'registration' && !t.isRegistered && (
                    <button onClick={async () => {
                      try {
                        await fetch(`/api/lab/battle-arena/tournaments/${t.id}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: 'current-user', agentId: model1 || 'gpt-4' }) })
                        setTournaments(prev => prev.map(x => x.id === t.id ? { ...x, isRegistered: true, participants: x.participants + 1 } : x))
                      } catch {}
                    }}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-sm hover:shadow-md transition-shadow whitespace-nowrap">
                      Join
                    </button>
                  )}
                  {t.isRegistered && <span className="text-green-600 text-sm font-medium">✓ Joined</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
