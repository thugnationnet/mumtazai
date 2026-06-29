/**
 * Emotion Visualizer Logic - AI Lab Module
 * Handles emotion analysis, visualization, and real-time emotion tracking
 */

export interface EmotionVisualizerState {
  isLoading: boolean;
  isAnalyzing: boolean;
  isRecording: boolean;
  error: string | null;
  success: boolean;
  currentAnalysis: EmotionAnalysis | null;
  analysisHistory: EmotionAnalysis[];
  realTimeData: RealTimeEmotionData | null;
  sessions: EmotionSession[];
  insights: EmotionInsights | null;
  settings: VisualizerSettings;
}

export interface EmotionAnalysis {
  id: string;
  timestamp: string;
  source: 'text' | 'voice' | 'facial' | 'multimodal';
  inputData: string | AudioData | ImageData;
  emotions: EmotionScore[];
  primaryEmotion: string;
  confidence: number;
  intensity: number;
  sentiment: SentimentAnalysis;
  context: AnalysisContext;
  visualization: VisualizationData;
  duration?: number; // For voice/video analysis
  userId: string;
}

export interface EmotionScore {
  emotion: string;
  score: number; // 0-1
  confidence: number; // 0-1
  category: 'primary' | 'secondary';
  description: string;
}

export interface SentimentAnalysis {
  polarity: number; // -1 to 1
  magnitude: number; // 0-1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  aspects: AspectSentiment[];
}

export interface AspectSentiment {
  aspect: string;
  sentiment: number;
  keywords: string[];
}

export interface AnalysisContext {
  sessionId?: string;
  previousEmotions?: string[];
  timeOfDay: string;
  environment: string;
  activityType?: string;
  stressLevel?: number;
  energyLevel?: number;
}

export interface VisualizationData {
  colorMap: ColorMapping[];
  chartData: ChartDataPoint[];
  emotionWheel: EmotionWheelData;
  timeline: TimelineData[];
  heatmap: HeatmapData;
  patterns: EmotionPattern[];
}

export interface ColorMapping {
  emotion: string;
  color: string;
  intensity: number;
}

export interface ChartDataPoint {
  timestamp: string;
  emotion: string;
  value: number;
  label: string;
}

export interface EmotionWheelData {
  segments: WheelSegment[];
  center: CenterData;
  radius: number;
}

export interface WheelSegment {
  emotion: string;
  startAngle: number;
  endAngle: number;
  value: number;
  color: string;
  innerRadius: number;
  outerRadius: number;
}

export interface CenterData {
  primaryEmotion: string;
  intensity: number;
  color: string;
}

export interface TimelineData {
  timestamp: string;
  emotions: EmotionScore[];
  event?: string;
  marker?: string;
}

export interface HeatmapData {
  matrix: number[][];
  emotions: string[];
  timeLabels: string[];
  maxValue: number;
}

export interface EmotionPattern {
  type: 'trend' | 'cycle' | 'spike' | 'plateau';
  emotions: string[];
  duration: number;
  frequency: number;
  description: string;
  significance: number;
}

export interface RealTimeEmotionData {
  currentEmotion: string;
  intensity: number;
  confidence: number;
  timestamp: string;
  trend: 'rising' | 'falling' | 'stable';
  rate: number; // Change rate
  predictions: EmotionPrediction[];
}

export interface EmotionPrediction {
  emotion: string;
  probability: number;
  timeframe: number; // Minutes
  factors: string[];
}

export interface EmotionSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number;
  analyses: string[];
  summary: SessionSummary;
  insights: string[];
  tags: string[];
  notes?: string;
  userId: string;
}

export interface SessionSummary {
  dominantEmotions: EmotionScore[];
  emotionalRange: number;
  stability: number;
  averageIntensity: number;
  transitionCount: number;
  moodTrend: 'improving' | 'declining' | 'stable';
}

export interface EmotionInsights {
  personalPatterns: Pattern[];
  recommendations: Recommendation[];
  triggers: Trigger[];
  wellnessScore: number;
  emotionalIntelligence: EIScore;
  comparisons: ComparisonData;
}

export interface Pattern {
  type: string;
  description: string;
  frequency: string;
  confidence: number;
  examples: string[];
}

export interface Recommendation {
  category: 'wellbeing' | 'productivity' | 'relationships' | 'mindfulness';
  title: string;
  description: string;
  actions: string[];
  priority: 'low' | 'medium' | 'high';
  evidence: string[];
}

export interface Trigger {
  trigger: string;
  emotions: string[];
  frequency: number;
  intensity: number;
  context: string[];
}

export interface EIScore {
  overall: number;
  selfAwareness: number;
  selfRegulation: number;
  empathy: number;
  socialSkills: number;
  breakdown: EIBreakdown[];
}

export interface EIBreakdown {
  skill: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

export interface ComparisonData {
  avgUser: EmotionScore[];
  ageGroup: EmotionScore[];
  timeOfDay: EmotionScore[];
  seasonal: EmotionScore[];
}

export interface VisualizerSettings {
  defaultVisualization: 'wheel' | 'chart' | 'heatmap' | 'timeline';
  realTimeEnabled: boolean;
  emotionFilters: string[];
  sensitivityLevel: number;
  colorScheme: 'default' | 'colorblind' | 'dark' | 'pastel';
  animations: boolean;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  extremeEmotions: boolean;
  patternDetection: boolean;
  sessionSummaries: boolean;
  insights: boolean;
}

export interface PrivacySettings {
  dataRetention: number; // Days
  shareAnalytics: boolean;
  exportEnabled: boolean;
  deleteOnRequest: boolean;
}

export interface AudioData {
  url: string;
  duration: number;
  format: string;
  sampleRate: number;
}

export interface ImageData {
  url: string;
  width: number;
  height: number;
  format: string;
}

export class EmotionVisualizerLogic {
  private state: EmotionVisualizerState;
  private realTimeInterval: NodeJS.Timeout | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private webcamStream: MediaStream | null = null;

  constructor() {
    this.state = {
      isLoading: false,
      isAnalyzing: false,
      isRecording: false,
      error: null,
      success: false,
      currentAnalysis: null,
      analysisHistory: [],
      realTimeData: null,
      sessions: [],
      insights: null,
      settings: {
        defaultVisualization: 'wheel',
        realTimeEnabled: false,
        emotionFilters: [],
        sensitivityLevel: 0.7,
        colorScheme: 'default',
        animations: true,
        notifications: {
          extremeEmotions: true,
          patternDetection: true,
          sessionSummaries: true,
          insights: true,
        },
        privacy: {
          dataRetention: 30,
          shareAnalytics: false,
          exportEnabled: true,
          deleteOnRequest: true,
        },
      },
    };
  }

  /**
   * Initialize Emotion Visualizer
   */
  async initialize(userId: string): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const [history, sessions, insights, settings] = await Promise.all([
        this.fetchAnalysisHistory(userId),
        this.fetchSessions(userId),
        this.fetchInsights(userId),
        this.fetchSettings(userId),
      ]);

      this.state.analysisHistory = history;
      this.state.sessions = sessions;
      this.state.insights = insights;

      if (settings) {
        this.state.settings = { ...this.state.settings, ...settings };
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load Emotion Visualizer';
      this.state.error = message;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Analyze text for emotions
   */
  async analyzeText(
    text: string,
    context?: Partial<AnalysisContext>
  ): Promise<EmotionAnalysis> {
    this.state.isAnalyzing = true;
    this.state.error = null;

    try {
      const response = await fetch('/api/lab/emotion-visualizer/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          context: this.buildContext(context),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze text');
      }

      const analysis = data.analysis;
      this.state.currentAnalysis = analysis;
      this.state.analysisHistory.unshift(analysis);
      this.state.success = true;

      this.trackEmotionEvent('text_analyzed', {
        primaryEmotion: analysis.primaryEmotion,
        confidence: analysis.confidence,
        textLength: text.length,
      });

      return analysis;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to analyze text';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isAnalyzing = false;
    }
  }

  /**
   * Analyze voice/audio for emotions
   */
  async analyzeVoice(audioFile: File): Promise<EmotionAnalysis> {
    this.state.isAnalyzing = true;
    this.state.error = null;

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('context', JSON.stringify(this.buildContext()));

      const response = await fetch(
        '/api/lab/emotion-visualizer/analyze-voice',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze voice');
      }

      const analysis = data.analysis;
      this.state.currentAnalysis = analysis;
      this.state.analysisHistory.unshift(analysis);
      this.state.success = true;

      this.trackEmotionEvent('voice_analyzed', {
        primaryEmotion: analysis.primaryEmotion,
        confidence: analysis.confidence,
        duration: analysis.duration,
      });

      return analysis;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to analyze voice';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isAnalyzing = false;
    }
  }

  /**
   * Start facial emotion recognition
   */
  async startFacialRecognition(): Promise<void> {
    this.state.isRecording = true;
    this.state.error = null;

    try {
      // Request webcam access
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // Setup canvas for face detection
      this.canvas = document.createElement('canvas');
      const video = document.createElement('video');
      video.srcObject = this.webcamStream;
      video.play();

      // Start real-time analysis
      const analyzeFrame = async () => {
        if (!this.state.isRecording) return;

        try {
          // Capture frame
          const ctx = this.canvas!.getContext('2d')!;
          ctx.drawImage(video, 0, 0, this.canvas!.width, this.canvas!.height);

          // Convert to blob
          this.canvas!.toBlob(async (blob) => {
            if (blob) {
              const formData = new FormData();
              formData.append('image', blob);
              formData.append('context', JSON.stringify(this.buildContext()));

              const response = await fetch(
                '/api/lab/emotion-visualizer/analyze-facial',
                {
                  method: 'POST',
                  body: formData,
                }
              );

              if (response.ok) {
                const data = await response.json();
                this.updateRealTimeData(data.analysis);
              }
            }
          });

          // Schedule next frame analysis
          setTimeout(analyzeFrame, 1000); // Analyze every second
        } catch (error) {
          console.error('Frame analysis error:', error);
        }
      };

      video.onloadedmetadata = () => {
        this.canvas!.width = video.videoWidth;
        this.canvas!.height = video.videoHeight;
        analyzeFrame();
      };

      this.trackEmotionEvent('facial_recognition_started');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to start facial recognition';
      this.state.error = message;
      this.state.isRecording = false;
    }
  }

  /**
   * Stop facial emotion recognition
   */
  stopFacialRecognition(): void {
    this.state.isRecording = false;

    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach((track) => track.stop());
      this.webcamStream = null;
    }

    if (this.canvas) {
      this.canvas = null;
    }

    this.state.realTimeData = null;
    this.trackEmotionEvent('facial_recognition_stopped');
  }

  /**
   * Start voice recording for real-time analysis
   */
  async startVoiceRecording(): Promise<void> {
    this.state.isRecording = true;
    this.state.error = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      this.mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', {
          type: 'audio/webm',
        });

        try {
          const analysis = await this.analyzeVoice(audioFile);
          this.updateRealTimeData(analysis);
        } catch (error) {
          console.error('Voice analysis error:', error);
        }
      };

      this.mediaRecorder.start();

      // Stop and restart recording every 5 seconds for real-time analysis
      this.realTimeInterval = setInterval(() => {
        if (this.mediaRecorder && this.state.isRecording) {
          this.mediaRecorder.stop();
          setTimeout(() => {
            if (this.state.isRecording) {
              audioChunks.length = 0;
              this.mediaRecorder!.start();
            }
          }, 100);
        }
      }, 5000);

      this.trackEmotionEvent('voice_recording_started');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to start voice recording';
      this.state.error = message;
      this.state.isRecording = false;
    }
  }

  /**
   * Stop voice recording
   */
  stopVoiceRecording(): void {
    this.state.isRecording = false;

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = null;
    }

    this.state.realTimeData = null;
    this.trackEmotionEvent('voice_recording_stopped');
  }

  /**
   * Start emotion session
   */
  async startSession(tags?: string[]): Promise<EmotionSession> {
    const session: EmotionSession = {
      id: `session_${Date.now()}`,
      startTime: new Date().toISOString(),
      duration: 0,
      analyses: [],
      summary: {
        dominantEmotions: [],
        emotionalRange: 0,
        stability: 0,
        averageIntensity: 0,
        transitionCount: 0,
        moodTrend: 'stable',
      },
      insights: [],
      tags: tags || [],
      userId: 'current_user',
    };

    this.state.sessions.unshift(session);

    this.trackEmotionEvent('session_started', {
      sessionId: session.id,
      tags,
    });

    return session;
  }

  /**
   * End emotion session
   */
  async endSession(sessionId: string, notes?: string): Promise<void> {
    const sessionIndex = this.state.sessions.findIndex(
      (s) => s.id === sessionId
    );
    if (sessionIndex === -1) return;

    const session = this.state.sessions[sessionIndex];
    session.endTime = new Date().toISOString();
    session.duration =
      new Date(session.endTime).getTime() -
      new Date(session.startTime).getTime();
    session.notes = notes;

    // Generate session summary
    session.summary = await this.generateSessionSummary(sessionId);

    // Save session
    try {
      await fetch('/api/lab/emotion-visualizer/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }

    this.trackEmotionEvent('session_ended', {
      sessionId,
      duration: session.duration,
      analysesCount: session.analyses.length,
    });
  }

  /**
   * Generate insights from analysis history
   */
  async generateInsights(userId: string): Promise<EmotionInsights> {
    this.state.isLoading = true;

    try {
      const response = await fetch(
        `/api/lab/emotion-visualizer/insights/${userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysisHistory: this.state.analysisHistory,
            sessions: this.state.sessions,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate insights');
      }

      this.state.insights = data.insights;

      this.trackEmotionEvent('insights_generated', {
        wellnessScore: data.insights.wellnessScore,
        patternsCount: data.insights.personalPatterns.length,
      });

      return data.insights;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate insights';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Update visualizer settings
   */
  async updateSettings(
    newSettings: Partial<VisualizerSettings>
  ): Promise<void> {
    this.state.settings = { ...this.state.settings, ...newSettings };

    try {
      await fetch('/api/lab/emotion-visualizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state.settings),
      });

      this.trackEmotionEvent('settings_updated', {
        changes: Object.keys(newSettings),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Export analysis data
   */
  async exportData(
    format: 'csv' | 'json' | 'pdf',
    dateRange?: { start: string; end: string }
  ): Promise<void> {
    try {
      const response = await fetch('/api/lab/emotion-visualizer/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          dateRange,
          analysisHistory: this.state.analysisHistory,
          sessions: this.state.sessions,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `emotion-analysis-${format}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.trackEmotionEvent('data_exported', { format });
      }
    } catch (error) {
      console.error('Export failed:', error);
      this.state.error = 'Failed to export data';
    }
  }

  /**
   * Private helper methods
   */
  private async fetchAnalysisHistory(
    userId: string
  ): Promise<EmotionAnalysis[]> {
    try {
      const response = await fetch(
        `/api/lab/emotion-visualizer/history/${userId}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.analyses || [];
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  }

  private async fetchSessions(userId: string): Promise<EmotionSession[]> {
    try {
      const response = await fetch(
        `/api/lab/emotion-visualizer/sessions/${userId}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  private async fetchInsights(userId: string): Promise<EmotionInsights | null> {
    try {
      const response = await fetch(
        `/api/lab/emotion-visualizer/insights/${userId}`
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.insights || null;
    } catch (error) {
      console.error('Error fetching insights:', error);
      return null;
    }
  }

  private async fetchSettings(
    userId: string
  ): Promise<Partial<VisualizerSettings> | null> {
    try {
      const response = await fetch(
        `/api/lab/emotion-visualizer/settings/${userId}`
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.settings || null;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }

  private buildContext(context?: Partial<AnalysisContext>): AnalysisContext {
    const now = new Date();
    return {
      timeOfDay: this.getTimeOfDay(now),
      environment: 'web',
      previousEmotions: this.getRecentEmotions(),
      ...context,
    };
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private getRecentEmotions(): string[] {
    return this.state.analysisHistory
      .slice(0, 5)
      .map((analysis) => analysis.primaryEmotion);
  }

  private updateRealTimeData(analysis: EmotionAnalysis): void {
    const previousData = this.state.realTimeData;

    this.state.realTimeData = {
      currentEmotion: analysis.primaryEmotion,
      intensity: analysis.intensity,
      confidence: analysis.confidence,
      timestamp: analysis.timestamp,
      trend: this.calculateTrend(previousData, analysis),
      rate: this.calculateChangeRate(previousData, analysis),
      predictions: [], // Would be generated by AI
    };
  }

  private calculateTrend(
    previous: RealTimeEmotionData | null,
    current: EmotionAnalysis
  ): 'rising' | 'falling' | 'stable' {
    if (!previous) return 'stable';

    const intensityChange = current.intensity - previous.intensity;
    if (Math.abs(intensityChange) < 0.1) return 'stable';
    return intensityChange > 0 ? 'rising' : 'falling';
  }

  private calculateChangeRate(
    previous: RealTimeEmotionData | null,
    current: EmotionAnalysis
  ): number {
    if (!previous) return 0;

    const timeDiff =
      new Date(current.timestamp).getTime() -
      new Date(previous.timestamp).getTime();
    const intensityDiff = current.intensity - previous.intensity;

    return timeDiff > 0 ? intensityDiff / (timeDiff / 1000) : 0; // Per second
  }

  private async generateSessionSummary(
    sessionId: string
  ): Promise<SessionSummary> {
    const session = this.state.sessions.find((s) => s.id === sessionId);
    if (!session) {
      return {
        dominantEmotions: [],
        emotionalRange: 0,
        stability: 0,
        averageIntensity: 0,
        transitionCount: 0,
        moodTrend: 'stable',
      };
    }

    // Get analyses for this session
    const sessionAnalyses = this.state.analysisHistory.filter(
      (analysis) =>
        analysis.timestamp >= session.startTime &&
        (!session.endTime || analysis.timestamp <= session.endTime)
    );

    // Calculate summary metrics
    const emotionCounts = new Map<string, number>();
    let totalIntensity = 0;
    let intensities: number[] = [];

    sessionAnalyses.forEach((analysis) => {
      const count = emotionCounts.get(analysis.primaryEmotion) || 0;
      emotionCounts.set(analysis.primaryEmotion, count + 1);

      totalIntensity += analysis.intensity;
      intensities.push(analysis.intensity);
    });

    const dominantEmotions = Array.from(emotionCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion, count]) => ({
        emotion,
        score: count / sessionAnalyses.length,
        confidence: 0.8,
        category: 'primary' as const,
        description: `${emotion} (${count} occurrences)`,
      }));

    const emotionalRange =
      intensities.length > 1
        ? Math.max(...intensities) - Math.min(...intensities)
        : 0;

    const stability =
      intensities.length > 1
        ? 1 - this.calculateVariance(intensities) / Math.max(...intensities)
        : 1;

    return {
      dominantEmotions,
      emotionalRange,
      stability,
      averageIntensity: totalIntensity / sessionAnalyses.length || 0,
      transitionCount: this.countEmotionTransitions(sessionAnalyses),
      moodTrend: this.calculateMoodTrend(intensities),
    };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  }

  private countEmotionTransitions(analyses: EmotionAnalysis[]): number {
    let transitions = 0;
    for (let i = 1; i < analyses.length; i++) {
      if (analyses[i].primaryEmotion !== analyses[i - 1].primaryEmotion) {
        transitions++;
      }
    }
    return transitions;
  }

  private calculateMoodTrend(
    intensities: number[]
  ): 'improving' | 'declining' | 'stable' {
    if (intensities.length < 2) return 'stable';

    const firstHalf = intensities.slice(0, Math.floor(intensities.length / 2));
    const secondHalf = intensities.slice(Math.floor(intensities.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (Math.abs(difference) < 0.1) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  }

  private trackEmotionEvent(
    event: string,
    properties?: Record<string, any>
  ): void {
    try {
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('Emotion Visualizer', {
          event,
          timestamp: new Date().toISOString(),
          ...properties,
        });
      }
    } catch (error) {
      console.error('Error tracking emotion event:', error);
    }
  }

  /**
   * Public getters
   */
  getState(): EmotionVisualizerState {
    return { ...this.state };
  }

  getCurrentAnalysis(): EmotionAnalysis | null {
    return this.state.currentAnalysis;
  }

  getRealTimeData(): RealTimeEmotionData | null {
    return this.state.realTimeData;
  }

  getAnalysisHistory(limit?: number): EmotionAnalysis[] {
    return limit
      ? this.state.analysisHistory.slice(0, limit)
      : this.state.analysisHistory;
  }

  getSessions(): EmotionSession[] {
    return this.state.sessions;
  }

  getInsights(): EmotionInsights | null {
    return this.state.insights;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.error = null;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopFacialRecognition();
    this.stopVoiceRecording();
  }
}

// Export singleton instance
export const emotionVisualizerLogic = new EmotionVisualizerLogic();

// Export utility functions
export const emotionVisualizerUtils = {
  /**
   * Get emotion color
   */
  getEmotionColor(emotion: string): string {
    const colors = {
      joy: '#FFD700',
      happiness: '#FFA500',
      excitement: '#FF6347',
      love: '#FF69B4',
      sadness: '#4169E1',
      anger: '#DC143C',
      fear: '#9932CC',
      surprise: '#00CED1',
      disgust: '#228B22',
      neutral: '#808080',
      anxiety: '#8A2BE2',
      calm: '#20B2AA',
      confident: '#32CD32',
      frustrated: '#B22222',
    };
    return colors[emotion as keyof typeof colors] || '#808080';
  },

  /**
   * Format confidence score
   */
  formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  },

  /**
   * Format intensity
   */
  formatIntensity(intensity: number): string {
    if (intensity < 0.3) return 'Low';
    if (intensity < 0.7) return 'Medium';
    return 'High';
  },

  /**
   * Get emotion description
   */
  getEmotionDescription(emotion: string): string {
    const descriptions = {
      joy: 'A feeling of great pleasure and happiness',
      sadness: 'Feeling of sorrow or unhappiness',
      anger: 'Strong feeling of displeasure or hostility',
      fear: 'Unpleasant emotion caused by threat or danger',
      surprise: 'Feeling of mild astonishment or shock',
      disgust: 'Feeling of revulsion or strong disapproval',
      neutral: 'No strong emotional state detected',
      anxiety: 'Feeling of worry or unease',
      calm: 'Peaceful and relaxed state',
      excited: 'Feeling of great enthusiasm and eagerness',
    };
    return (
      descriptions[emotion as keyof typeof descriptions] ||
      'Unknown emotional state'
    );
  },
};
