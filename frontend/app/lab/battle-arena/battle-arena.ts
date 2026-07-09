/**
 * Battle Arena Logic - AI Lab Module
 * Handles AI agent battles, competitions, matchmaking, and tournament systems
 */

export interface BattleArenaState {
  isLoading: boolean;
  isBattling: boolean;
  isMatching: boolean;
  error: string | null;
  success: boolean;
  currentBattle: Battle | null;
  battleHistory: BattleRecord[];
  userStats: BattleStats;
  leaderboard: BattleLeaderboard[];
  availableAgents: BattleAgent[];
  tournaments: Tournament[];
}

export interface Battle {
  id: string;
  type: 'duel' | 'tournament' | 'practice' | 'ranked';
  status: 'preparing' | 'active' | 'completed' | 'cancelled';
  participants: BattleParticipant[];
  rounds: BattleRound[];
  currentRound: number;
  totalRounds: number;
  winner?: string;
  startedAt: string;
  completedAt?: string;
  settings: BattleSettings;
}

export interface BattleParticipant {
  id: string;
  type: 'user' | 'ai';
  name: string;
  avatar?: string;
  agent: BattleAgent;
  score: number;
  status: 'ready' | 'active' | 'eliminated' | 'disconnected';
}

export interface BattleAgent {
  id: string;
  name: string;
  type: 'creative' | 'analytical' | 'strategic' | 'conversational';
  level: number;
  skills: AgentSkills;
  specialty: string;
  avatar?: string;
  stats: AgentBattleStats;
}

export interface AgentSkills {
  creativity: number;
  logic: number;
  speed: number;
  accuracy: number;
  adaptability: number;
}

export interface AgentBattleStats {
  battlesTotal: number;
  battlesWon: number;
  winRate: number;
  averageScore: number;
  highestScore: number;
  ranking: number;
}

export interface BattleRound {
  id: string;
  roundNumber: number;
  challenge: BattleChallenge;
  responses: BattleResponse[];
  scores: Record<string, number>;
  winner: string;
  startedAt: string;
  completedAt?: string;
  timeLimit: number;
}

export interface BattleChallenge {
  id: string;
  type: 'riddle' | 'creativity' | 'logic' | 'speed' | 'knowledge' | 'strategy';
  title: string;
  description: string;
  prompt: string;
  criteria: string[];
  maxPoints: number;
  timeLimit: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

export interface BattleResponse {
  participantId: string;
  response: string;
  submittedAt: string;
  score: number;
  feedback?: string;
  timeUsed: number;
}

export interface BattleSettings {
  rounds: number;
  timePerRound: number; // seconds
  challengeTypes: string[];
  difficulty: 'mixed' | 'easy' | 'medium' | 'hard' | 'expert';
  scoring: 'standard' | 'weighted' | 'elimination';
  allowSpectators: boolean;
  isRanked: boolean;
}

export interface BattleStats {
  battlesTotal: number;
  battlesWon: number;
  battlesLost: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  totalScore: number;
  averageScore: number;
  highestScore: number;
  ranking: number;
  favoriteAgent: string;
  favoriteChallenge: string;
}

export interface BattleRecord {
  id: string;
  type: 'duel' | 'tournament' | 'practice' | 'ranked';
  opponent: string;
  result: 'won' | 'lost' | 'draw' | 'cancelled';
  score: number;
  opponentScore: number;
  rounds: number;
  duration: number; // seconds
  challenges: string[];
  completedAt: string;
  replayId?: string;
}

export interface BattleLeaderboard {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  rating: number;
  wins: number;
  losses: number;
  winRate: number;
  streak: number;
  favoriteAgent: string;
  lastActive: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'bracket' | 'round_robin' | 'swiss' | 'elimination';
  status: 'registration' | 'active' | 'completed' | 'cancelled';
  participants: number;
  maxParticipants: number;
  rounds: number;
  currentRound: number;
  prize: string;
  startTime: string;
  endTime?: string;
  registrationDeadline: string;
  settings: BattleSettings;
  isRegistered: boolean;
}

export class BattleArenaLogic {
  private state: BattleArenaState;
  private battleSubscription: WebSocket | null = null;

  constructor() {
    this.state = {
      isLoading: false,
      isBattling: false,
      isMatching: false,
      error: null,
      success: false,
      currentBattle: null,
      battleHistory: [],
      userStats: this.getDefaultBattleStats(),
      leaderboard: [],
      availableAgents: [],
      tournaments: [],
    };
  }

  /**
   * Get default battle stats
   */
  private getDefaultBattleStats(): BattleStats {
    return {
      battlesTotal: 0,
      battlesWon: 0,
      battlesLost: 0,
      winRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalScore: 0,
      averageScore: 0,
      highestScore: 0,
      ranking: 0,
      favoriteAgent: '',
      favoriteChallenge: '',
    };
  }

  /**
   * Initialize battle arena
   */
  async initialize(userId: string): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const [stats, history, leaderboard, agents, tournaments] =
        await Promise.all([
          this.fetchBattleStats(userId),
          this.fetchBattleHistory(userId),
          this.fetchLeaderboard(),
          this.fetchAvailableAgents(),
          this.fetchTournaments(),
        ]);

      this.state.userStats = stats;
      this.state.battleHistory = history;
      this.state.leaderboard = leaderboard;
      this.state.availableAgents = agents;
      this.state.tournaments = tournaments;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load battle arena';
      this.state.error = message;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Fetch user battle statistics
   */
  private async fetchBattleStats(userId: string): Promise<BattleStats> {
    try {
      const response = await fetch(`/api/lab/battle-arena/stats/${userId}`);
      if (!response.ok) return this.getDefaultBattleStats();
      const data = await response.json();
      return { ...this.getDefaultBattleStats(), ...data.stats };
    } catch (error) {
      console.error('Error fetching battle stats:', error);
      return this.getDefaultBattleStats();
    }
  }

  /**
   * Fetch battle history
   */
  private async fetchBattleHistory(userId: string): Promise<BattleRecord[]> {
    try {
      const response = await fetch(`/api/lab/battle-arena/history/${userId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Error fetching battle history:', error);
      return [];
    }
  }

  /**
   * Fetch leaderboard
   */
  private async fetchLeaderboard(): Promise<BattleLeaderboard[]> {
    try {
      const response = await fetch('/api/lab/battle-arena/leaderboard');
      if (!response.ok) return [];
      const data = await response.json();
      return data.leaderboard || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Fetch available battle agents
   */
  private async fetchAvailableAgents(): Promise<BattleAgent[]> {
    try {
      const response = await fetch('/api/lab/battle-arena/agents');
      if (!response.ok) return [];
      const data = await response.json();
      return data.agents || [];
    } catch (error) {
      console.error('Error fetching available agents:', error);
      return [];
    }
  }

  /**
   * Fetch tournaments
   */
  private async fetchTournaments(): Promise<Tournament[]> {
    try {
      const response = await fetch('/api/lab/battle-arena/tournaments');
      if (!response.ok) return [];
      const data = await response.json();
      return data.tournaments || [];
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      return [];
    }
  }

  /**
   * Start matchmaking for a battle
   */
  async startMatchmaking(
    userId: string,
    agentId: string,
    battleType: 'duel' | 'ranked' | 'practice',
    settings?: Partial<BattleSettings>
  ): Promise<void> {
    this.state.isMatching = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/lab/battle-arena/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          agentId,
          battleType,
          settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start matchmaking');
      }

      // Connect to battle WebSocket for real-time updates
      this.connectToBattle(data.matchId);

      this.trackBattleEvent('matchmaking_started', {
        agentId,
        battleType,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start matchmaking';
      this.state.error = message;
      this.state.isMatching = false;
      throw new Error(message);
    }
  }

  /**
   * Cancel matchmaking
   */
  async cancelMatchmaking(): Promise<void> {
    try {
      await fetch('/api/lab/battle-arena/matchmaking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      this.state.isMatching = false;
      this.disconnectFromBattle();

      this.trackBattleEvent('matchmaking_cancelled');
    } catch (error) {
      console.error('Error cancelling matchmaking:', error);
    }
  }

  /**
   * Connect to battle WebSocket
   */
  private connectToBattle(battleId: string): void {
    try {
      const wsUrl = `${
        process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
      }/battle/${battleId}`;
      this.battleSubscription = new WebSocket(wsUrl);

      this.battleSubscription.onopen = () => {
        console.log('Connected to battle');
        this.state.isMatching = false;
        this.state.isBattling = true;
      };

      this.battleSubscription.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleBattleMessage(message);
      };

      this.battleSubscription.onclose = () => {
        console.log('Disconnected from battle');
        this.state.isBattling = false;
        this.battleSubscription = null;
      };

      this.battleSubscription.onerror = (error) => {
        console.error('Battle WebSocket error:', error);
        this.state.error = 'Connection error during battle';
      };
    } catch (error) {
      console.error('Error connecting to battle:', error);
      this.state.error = 'Failed to connect to battle';
    }
  }

  /**
   * Handle battle WebSocket messages
   */
  private handleBattleMessage(message: any): void {
    switch (message.type) {
      case 'battle_started':
        this.state.currentBattle = message.battle;
        this.trackBattleEvent('battle_started', {
          battleId: message.battle.id,
        });
        break;

      case 'round_started':
        if (this.state.currentBattle) {
          this.state.currentBattle.currentRound = message.roundNumber;
          this.state.currentBattle.rounds.push(message.round);
        }
        break;

      case 'challenge_received':
        // Update current round with new challenge
        if (this.state.currentBattle) {
          const currentRound =
            this.state.currentBattle.rounds[
              this.state.currentBattle.currentRound - 1
            ];
          if (currentRound) {
            currentRound.challenge = message.challenge;
          }
        }
        break;

      case 'round_completed':
        if (this.state.currentBattle) {
          const round = this.state.currentBattle.rounds.find(
            (r) => r.id === message.roundId
          );
          if (round) {
            round.scores = message.scores;
            round.winner = message.winner;
            round.completedAt = message.completedAt;
          }
        }
        break;

      case 'battle_completed':
        if (this.state.currentBattle) {
          this.state.currentBattle.status = 'completed';
          this.state.currentBattle.winner = message.winner;
          this.state.currentBattle.completedAt = message.completedAt;

          // Add to history
          this.addBattleToHistory(this.state.currentBattle);

          // Update stats
          this.updateStatsAfterBattle(this.state.currentBattle);
        }

        this.trackBattleEvent('battle_completed', {
          battleId: message.battleId,
          winner: message.winner,
        });
        break;

      case 'error':
        this.state.error = message.error;
        break;

      default:
        console.log('Unknown battle message:', message);
    }
  }

  /**
   * Submit battle response
   */
  async submitBattleResponse(
    battleId: string,
    roundId: string,
    response: string
  ): Promise<void> {
    if (!this.battleSubscription) {
      throw new Error('Not connected to battle');
    }

    const message = {
      type: 'submit_response',
      battleId,
      roundId,
      response,
      timestamp: new Date().toISOString(),
    };

    this.battleSubscription.send(JSON.stringify(message));

    this.trackBattleEvent('response_submitted', {
      battleId,
      roundId,
    });
  }

  /**
   * Create custom battle
   */
  async createCustomBattle(
    userId: string,
    agentId: string,
    settings: BattleSettings
  ): Promise<Battle> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/lab/battle-arena/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          agentId,
          settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create battle');
      }

      this.state.currentBattle = data.battle;
      this.connectToBattle(data.battle.id);

      this.trackBattleEvent('custom_battle_created', {
        battleId: data.battle.id,
      });

      return data.battle;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create battle';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Join tournament
   */
  async joinTournament(
    userId: string,
    tournamentId: string,
    agentId: string
  ): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const response = await fetch(
        `/api/lab/battle-arena/tournaments/${tournamentId}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, agentId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join tournament');
      }

      // Update tournament in local state
      const tournament = this.state.tournaments.find(
        (t) => t.id === tournamentId
      );
      if (tournament) {
        tournament.isRegistered = true;
        tournament.participants++;
      }

      this.state.success = true;
      this.trackBattleEvent('tournament_joined', {
        tournamentId,
        agentId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to join tournament';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Add battle to history
   */
  private addBattleToHistory(battle: Battle): void {
    const record: BattleRecord = {
      id: battle.id,
      type: battle.type,
      opponent: this.getOpponentName(battle),
      result: this.getBattleResult(battle),
      score: this.getUserScore(battle),
      opponentScore: this.getOpponentScore(battle),
      rounds: battle.totalRounds,
      duration: this.calculateBattleDuration(battle),
      challenges: battle.rounds.map((r) => r.challenge.type),
      completedAt: battle.completedAt || new Date().toISOString(),
    };

    this.state.battleHistory.unshift(record);

    // Keep only last 50 battles in memory
    if (this.state.battleHistory.length > 50) {
      this.state.battleHistory = this.state.battleHistory.slice(0, 50);
    }
  }

  /**
   * Update stats after battle
   */
  private updateStatsAfterBattle(battle: Battle): void {
    const result = this.getBattleResult(battle);
    const userScore = this.getUserScore(battle);

    this.state.userStats.battlesTotal++;
    this.state.userStats.totalScore += userScore;
    this.state.userStats.averageScore =
      this.state.userStats.totalScore / this.state.userStats.battlesTotal;

    if (userScore > this.state.userStats.highestScore) {
      this.state.userStats.highestScore = userScore;
    }

    if (result === 'won') {
      this.state.userStats.battlesWon++;
      this.state.userStats.currentStreak++;

      if (
        this.state.userStats.currentStreak > this.state.userStats.longestStreak
      ) {
        this.state.userStats.longestStreak = this.state.userStats.currentStreak;
      }
    } else if (result === 'lost') {
      this.state.userStats.battlesLost++;
      this.state.userStats.currentStreak = 0;
    }

    this.state.userStats.winRate =
      (this.state.userStats.battlesWon / this.state.userStats.battlesTotal) *
      100;
  }

  /**
   * Get opponent name from battle
   */
  private getOpponentName(battle: Battle): string {
    // Find opponent participant (not current user)
    const opponent = battle.participants.find(
      (p) => p.type === 'ai' || p.id !== 'current-user'
    );
    return opponent?.name || 'Unknown';
  }

  /**
   * Get battle result for current user
   */
  private getBattleResult(
    battle: Battle
  ): 'won' | 'lost' | 'draw' | 'cancelled' {
    if (battle.status === 'cancelled') return 'cancelled';

    const userParticipant = battle.participants.find(
      (p) => p.id === 'current-user'
    );
    const opponent = battle.participants.find((p) => p.id !== 'current-user');

    if (!userParticipant || !opponent) return 'cancelled';

    if (userParticipant.score > opponent.score) return 'won';
    if (userParticipant.score < opponent.score) return 'lost';
    return 'draw';
  }

  /**
   * Get user score from battle
   */
  private getUserScore(battle: Battle): number {
    const userParticipant = battle.participants.find(
      (p) => p.id === 'current-user'
    );
    return userParticipant?.score || 0;
  }

  /**
   * Get opponent score from battle
   */
  private getOpponentScore(battle: Battle): number {
    const opponent = battle.participants.find((p) => p.id !== 'current-user');
    return opponent?.score || 0;
  }

  /**
   * Calculate battle duration in seconds
   */
  private calculateBattleDuration(battle: Battle): number {
    if (!battle.completedAt) return 0;

    const start = new Date(battle.startedAt);
    const end = new Date(battle.completedAt);
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  }

  /**
   * Disconnect from battle
   */
  private disconnectFromBattle(): void {
    if (this.battleSubscription) {
      this.battleSubscription.close();
      this.battleSubscription = null;
    }
    this.state.isBattling = false;
    this.state.currentBattle = null;
  }

  /**
   * Get agent by ID
   */
  getAgentById(agentId: string): BattleAgent | null {
    return (
      this.state.availableAgents.find((agent) => agent.id === agentId) || null
    );
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type: string): BattleAgent[] {
    return this.state.availableAgents.filter((agent) => agent.type === type);
  }

  /**
   * Get user's ranking position
   */
  getUserRanking(userId: string): BattleLeaderboard | null {
    return (
      this.state.leaderboard.find((entry) => entry.userId === userId) || null
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.error = null;
  }

  /**
   * Get current state
   */
  getState(): BattleArenaState {
    return { ...this.state };
  }

  /**
   * Track battle events
   */
  private trackBattleEvent(
    event: string,
    properties?: Record<string, any>
  ): void {
    try {
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('Battle Arena', {
          event,
          timestamp: new Date().toISOString(),
          ...properties,
        });
      }
    } catch (error) {
      console.error('Error tracking battle event:', error);
    }
  }

  /**
   * Cleanup on unmount
   */
  cleanup(): void {
    this.disconnectFromBattle();
  }
}

// Export singleton instance
export const battleArenaLogic = new BattleArenaLogic();

// Export utility functions
export const battleArenaUtils = {
  /**
   * Format battle duration
   */
  formatBattleDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  },

  /**
   * Get battle type color
   */
  getBattleTypeColor(type: string): string {
    const colors = {
      duel: '#3B82F6',
      tournament: '#8B5CF6',
      practice: '#10B981',
      ranked: '#F59E0B',
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  },

  /**
   * Get result color
   */
  getResultColor(result: string): string {
    const colors = {
      won: '#10B981',
      lost: '#EF4444',
      draw: '#6B7280',
      cancelled: '#F97316',
    };
    return colors[result as keyof typeof colors] || '#6B7280';
  },

  /**
   * Calculate skill level color
   */
  getSkillLevelColor(level: number): string {
    if (level >= 80) return '#10B981'; // Green
    if (level >= 60) return '#3B82F6'; // Blue
    if (level >= 40) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  },

  /**
   * Format win rate
   */
  formatWinRate(winRate: number): string {
    return `${winRate.toFixed(1)}%`;
  },

  /**
   * Get challenge difficulty icon
   */
  getDifficultyIcon(difficulty: string): string {
    const icons = {
      easy: '⭐',
      medium: '⭐⭐',
      hard: '⭐⭐⭐',
      expert: '⭐⭐⭐⭐',
    };
    return icons[difficulty as keyof typeof icons] || '⭐';
  },
};
