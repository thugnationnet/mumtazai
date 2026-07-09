'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PhoneXMarkIcon } from '@heroicons/react/24/outline';

// ─── Voice mapping ─────────────────────────────────────────────────────────
// Female: shimmer (soft/warm) · verse (expressive/dramatic) · coral (friendly) · marin (professional)
// Male:   alloy (neutral) · ash (confident) · ballad (storyteller) · echo (warm) · sage (wise) · cedar (deep)
type OpenAIVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse' | 'marin' | 'cedar';

const AGENT_VOICE_MAP: Record<string, OpenAIVoice> = {
  // Female agents
  'julie-girlfriend':    'shimmer',
  'emma-emotional':      'shimmer',
  'drama-queen':         'verse',
  'mrs-boss':            'marin',
  'chef-biew':           'coral',
  'professor-astrology': 'shimmer',
  'nid-gaming':          'coral',
  // Male agents
  'einstein':            'sage',
  'chess-player':        'cedar',
  'knight-logic':        'sage',
  'comedy-king':         'echo',
  'rook-jokey':          'echo',
  'lazy-pawn':           'alloy',
  'tech-wizard':         'ash',
  'ben-sega':            'ballad',
  'bishop-burger':       'ballad',
  'fitness-guru':        'ash',
  'travel-buddy':        'echo',
};

// ─── Per-agent personality accent colors ────────────────────────────────────
const AGENT_ACCENT: Record<string, { color: string; glow: string; gradient: string }> = {
  'comedy-king':         { color: '#FCD34D', glow: 'rgba(252,211,77,0.35)',  gradient: 'from-yellow-400 to-amber-500'   },
  'drama-queen':         { color: '#E879F9', glow: 'rgba(232,121,249,0.35)', gradient: 'from-fuchsia-500 to-pink-500'   },
  'lazy-pawn':           { color: '#94A3B8', glow: 'rgba(148,163,184,0.25)', gradient: 'from-slate-500 to-slate-600'   },
  'rook-jokey':          { color: '#FB923C', glow: 'rgba(251,146,60,0.35)',  gradient: 'from-orange-400 to-red-500'    },
  'emma-emotional':      { color: '#F472B6', glow: 'rgba(244,114,182,0.35)', gradient: 'from-pink-400 to-rose-500'     },
  'julie-girlfriend':    { color: '#FB7185', glow: 'rgba(251,113,133,0.35)', gradient: 'from-rose-400 to-pink-500'     },
  'mrs-boss':            { color: '#818CF8', glow: 'rgba(129,140,248,0.35)', gradient: 'from-indigo-400 to-violet-600' },
  'knight-logic':        { color: '#38BDF8', glow: 'rgba(56,189,248,0.35)',  gradient: 'from-sky-400 to-blue-500'      },
  'tech-wizard':         { color: '#34D399', glow: 'rgba(52,211,153,0.35)',  gradient: 'from-emerald-400 to-teal-500'  },
  'chef-biew':           { color: '#FB923C', glow: 'rgba(251,146,60,0.35)',  gradient: 'from-orange-400 to-red-400'    },
  'bishop-burger':       { color: '#FCD34D', glow: 'rgba(252,211,77,0.35)',  gradient: 'from-amber-400 to-orange-500'  },
  'professor-astrology': { color: '#C084FC', glow: 'rgba(192,132,252,0.35)', gradient: 'from-violet-400 to-purple-600' },
  'fitness-guru':        { color: '#4ADE80', glow: 'rgba(74,222,128,0.35)',  gradient: 'from-green-400 to-emerald-500' },
  'travel-buddy':        { color: '#2DD4BF', glow: 'rgba(45,212,191,0.35)',  gradient: 'from-teal-400 to-cyan-500'    },
  'einstein':            { color: '#FDE68A', glow: 'rgba(253,230,138,0.35)', gradient: 'from-yellow-300 to-amber-400'  },
  'chess-player':        { color: '#CBD5E1', glow: 'rgba(203,213,225,0.25)', gradient: 'from-slate-300 to-slate-500'   },
  'ben-sega':            { color: '#F87171', glow: 'rgba(248,113,113,0.35)', gradient: 'from-red-400 to-orange-500'    },
  'nid-gaming':          { color: '#A78BFA', glow: 'rgba(167,139,250,0.35)', gradient: 'from-violet-400 to-indigo-500' },
  'random':              { color: '#60A5FA', glow: 'rgba(96,165,250,0.35)',  gradient: 'from-blue-400 to-indigo-500'   },
};

// Static heights for the pre-call idle bar visualization
const IDLE_BARS = [12, 20, 14, 28, 18, 32, 12, 24, 16, 36, 14, 26, 12, 20, 30, 14, 22, 18, 28, 16];

function getVoiceForAgent(id: string): OpenAIVoice {
  return AGENT_VOICE_MAP[id] || 'alloy';
}
function getAccentForAgent(id: string) {
  return AGENT_ACCENT[id] || { color: '#6366F1', glow: 'rgba(99,102,241,0.35)', gradient: 'from-indigo-500 to-purple-600' };
}

// Rounded rect helper (avoids ctx.roundRect() compatibility issues)
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

interface RealtimeVoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentId?: string;
  agentIcon?: string;
  systemPrompt?: string;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type SpeakingState   = 'idle' | 'user_speaking' | 'ai_speaking';

export default function RealtimeVoiceChat({
  isOpen,
  onClose,
  agentName,
  agentId,
  agentIcon,
  systemPrompt = 'You are a helpful AI assistant. Be conversational and friendly.',
}: RealtimeVoiceChatProps) {
  const selectedVoice = getVoiceForAgent(agentId || '');
  const accent = getAccentForAgent(agentId || '');

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [speakingState, setSpeakingState] = useState<SpeakingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [callDuration, setCallDuration] = useState<number>(0);

  // Audio / WebRTC refs
  const pcRef   = useRef<RTCPeerConnection | null>(null);  // WebRTC PeerConnection
  const dcRef   = useRef<RTCDataChannel | null>(null);     // DataChannel for control events
  const audioElRef = useRef<HTMLAudioElement | null>(null); // plays AI audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const hasActiveResponseRef = useRef<boolean>(false);
  const userSpeakingRef = useRef<boolean>(false);
  const greetingSentRef = useRef<boolean>(false);
  const currentResponseIdRef = useRef<string | null>(null);
  // Visualization refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vizFrameRef = useRef<number | null>(null);
  const speakingStateRef = useRef<SpeakingState>('idle');

  // Keep speakingStateRef in sync so rAF closure always reads current value
  useEffect(() => { speakingStateRef.current = speakingState; }, [speakingState]);

  // ── Canvas frequency visualization ─────────────────────────────────────
  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const state = speakingStateRef.current;
    const BARS = 48;
    const barW = Math.floor((W - (BARS - 1) * 2) / BARS);
    const maxH = H - 4;

    let amplitudes: number[];
    if (state === 'user_speaking' && analyserRef.current) {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const step = Math.floor(data.length / BARS);
      amplitudes = Array.from({ length: BARS }, (_, i) => data[i * step] / 255);
    } else if (state === 'ai_speaking' && playbackAnalyserRef.current) {
      const data = new Uint8Array(playbackAnalyserRef.current.frequencyBinCount);
      playbackAnalyserRef.current.getByteFrequencyData(data);
      const step = Math.floor(data.length / BARS);
      amplitudes = Array.from({ length: BARS }, (_, i) => data[i * step] / 255);
    } else {
      const t = Date.now() / 800;
      amplitudes = IDLE_BARS.map((v, i) => (v / 36) * (0.4 + 0.15 * Math.sin(t + i * 0.4)));
    }

    amplitudes.forEach((amp, i) => {
      const barH = Math.max(3, amp * maxH);
      const x = i * (barW + 2);
      const y = (H - barH) / 2;
      if (state === 'user_speaking') {
        ctx.fillStyle = `rgba(74,222,128,${0.45 + amp * 0.55})`;
      } else if (state === 'ai_speaking') {
        ctx.globalAlpha = 0.45 + amp * 0.55;
        ctx.fillStyle = accent.color;
      } else {
        ctx.fillStyle = 'rgba(99,102,241,0.3)';
      }
      drawRoundedRect(ctx, x, y, barW, barH, 3);
      ctx.globalAlpha = 1;
    });

    vizFrameRef.current = requestAnimationFrame(drawVisualization);
  }, [accent]);

  // Start / stop visualization loop with connection state
  useEffect(() => {
    if (connectionState === 'connected' || connectionState === 'connecting') {
      if (vizFrameRef.current) cancelAnimationFrame(vizFrameRef.current);
      vizFrameRef.current = requestAnimationFrame(drawVisualization);
    } else {
      if (vizFrameRef.current) { cancelAnimationFrame(vizFrameRef.current); vizFrameRef.current = null; }
      drawVisualization(); // draw idle static frame
    }
    return () => { if (vizFrameRef.current) { cancelAnimationFrame(vizFrameRef.current); vizFrameRef.current = null; } };
  }, [connectionState, drawVisualization]);

  // Format call duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start call timer
  useEffect(() => {
    if (isOpen && connectionState === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      if (!isOpen) setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isOpen, connectionState]);

  // Only clean up when modal closes — do NOT auto-connect
  useEffect(() => {
    if (!isOpen) {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [isOpen]);


  // Connect to OpenAI Realtime API via WebRTC (SDP proxy through our backend)
  const connectToRealtime = async () => {
    try {
      setConnectionState('connecting');
      setErrorMessage('');
      greetingSentRef.current = false;
      currentResponseIdRef.current = null;

      // 1. Mic access first — fail fast before creating the peer connection
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = micStream;

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. DataChannel for OpenAI control events (MUST be created before createOffer)
      const dc = pc.createDataChannel('oai-events', { ordered: true });
      dcRef.current = dc;
      dc.onmessage = (e) => handleRealtimeEvent(JSON.parse(e.data));
      dc.onopen = () => {
        // Configure session after data channel is open
        const sendConfig = () => {
          if (dc.readyState !== 'open') return;
          dc.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              voice: selectedVoice,
              turn_detection: { type: 'server_vad', threshold: 0.65, prefix_padding_ms: 600, silence_duration_ms: 800 },
            },
          }));
          // Send greeting
          if (!greetingSentRef.current) {
            greetingSentRef.current = true;
            dc.send(JSON.stringify({
              type: 'response.create',
              response: { modalities: ['text', 'audio'], instructions: 'Say one short natural greeting in character in English — one sentence only.' },
            }));
          }
        };
        sendConfig();
        setConnectionState('connected');
      };

      // 4. Handle incoming AI audio track
      pc.ontrack = (event) => {
        const el = new Audio();
        el.srcObject = event.streams[0];
        el.autoplay = true;
        audioElRef.current = el;
        // Wire analyser for AI audio visualization
        const audioCtx = new AudioContext();
        playbackContextRef.current = audioCtx;
        const src = audioCtx.createMediaStreamSource(event.streams[0]);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyser.connect(audioCtx.destination);
        playbackAnalyserRef.current = analyser;
      };

      // 5. Add microphone track
      micStream.getTracks().forEach(track => pc.addTrack(track, micStream));

      // Wire mic analyser for user audio visualization
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const micSource = audioContextRef.current.createMediaStreamSource(micStream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      micSource.connect(analyserRef.current);

      // 6. Create SDP offer and wait for ICE gathering
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') { resolve(); return; }
        const check = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', check); resolve(); } };
        pc.addEventListener('icegatheringstatechange', check);
        setTimeout(resolve, 5000); // timeout fallback
      });

      // 7. Send SDP offer to our backend proxy
      const _isAgentSub = typeof window !== 'undefined' &&
        window.location.hostname.endsWith('.mumtaz.ai') &&
        !['www','chat','studio','build','apps','demo','editor','lab','tools','community','support']
          .some(s => window.location.hostname.startsWith(s + '.'));
      const _sdpUrl = _isAgentSub
        ? '/api/agent/realtime/token'
        : `/api/agent/${agentId}/realtime/token`;

      const sdpResponse = await fetch(_sdpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer: pc.localDescription?.sdp, agentId: agentId || '' }),
      });

      if (!sdpResponse.ok) {
        const errData = await sdpResponse.json().catch(() => ({}));
        throw new Error(errData.error || `SDP exchange failed (${sdpResponse.status})`);
      }

      const { answer } = await sdpResponse.json();
      if (!answer) throw new Error('No SDP answer from server');

      // 8. Set remote description — WebRTC call established
      await pc.setRemoteDescription({ type: 'answer', sdp: answer });

    } catch (error: any) {
      console.error('[RealtimeVoice] Connection failed:', error);
      setErrorMessage(error.message || 'Failed to connect');
      setConnectionState('error');
    }
  };

  // Send a control event via the WebRTC DataChannel
  const sendEvent = (event: object) => {
    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify(event));
    }
  };

  // Handle events from OpenAI Realtime API
  const handleRealtimeEvent = (event: any) => {
    switch (event.type) {
      case 'session.created':
        break;

      case 'session.updated':
        // Agent greets the user ONCE with a short natural in-character line
        if (!greetingSentRef.current && dcRef.current?.readyState === 'open') {
          greetingSentRef.current = true;
          sendEvent({
            type: 'response.create',
            response: {
              modalities: ['text', 'audio'],
              instructions: 'Say one short natural greeting in character in English — one sentence only.',
            },
          });
        }
        break;

      case 'input_audio_buffer.speech_started':
        // User started speaking
        setSpeakingState('user_speaking');
        userSpeakingRef.current = true;
        
        // Stop any audio playback immediately
        stopAudioPlayback();
        
        // Only send response.cancel if AI is actively responding
        if (hasActiveResponseRef.current && dcRef.current?.readyState === 'open') {
          try {
            sendEvent({ type: 'response.cancel' });
          } catch (e) {}
          hasActiveResponseRef.current = false;
        }
        break;

      case 'input_audio_buffer.speech_stopped':
        setSpeakingState('idle');
        userSpeakingRef.current = false;
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // transcript available server-side but we don't display it
        break;

      case 'response.created':
        if (event.response?.id) {
          if (currentResponseIdRef.current && currentResponseIdRef.current !== event.response.id) {
            stopAudioPlayback();
          }
          currentResponseIdRef.current = event.response.id;
        }
        break;

      case 'response.audio_transcript.delta':
        // transcript delta — not displayed
        break;

      case 'response.audio_transcript.done':
        break;

      case 'response.audio.delta':
        // Receive audio chunk from AI - only play if user is not speaking
        hasActiveResponseRef.current = true;  // Mark that AI is responding
        if (event.delta && !userSpeakingRef.current) {
          const audioData = base64ToInt16Array(event.delta);
          audioQueueRef.current.push(audioData);
          playAudioQueue();  // Schedule chunk — gapless via AudioContext clock
          setSpeakingState('ai_speaking');
        }
        break;

      case 'response.audio.done':
        setSpeakingState('idle');
        break;

      case 'response.done':
        setSpeakingState('idle');
        hasActiveResponseRef.current = false;  // Response complete
        break;

      case 'response.cancelled':
        setSpeakingState('idle');
        hasActiveResponseRef.current = false;  // Response cancelled
        break;

      case 'error': {
        const errMsg = event.error?.message || (typeof event.error === 'string' ? event.error : JSON.stringify(event.error));
        const errCode = event.error?.code || event.error?.type || '';
        // Ignore benign interruption-related errors
        if (errCode === 'response_already_completed' || errCode === 'response_not_found' || errCode === 'response_cancel_not_active') {
          break;
        }
        console.error('[RealtimeVoice] API error:', errCode, errMsg);
        setErrorMessage(errMsg || 'API error');
        break;
      }

      default:
        // console.log('[RealtimeVoice] Event:', event.type);
        break;
    }
  };

  // Stop audio playback immediately (for interruption)
  const stopAudioPlayback = () => {
    audioQueueRef.current = [];
    nextPlayTimeRef.current = 0;
    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }
    playbackAnalyserRef.current = null;
  };

  // Convert base64 to Int16Array for audio playback
  const base64ToInt16Array = (base64: string): Int16Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  };

  // Play audio queue — gapless scheduled playback using AudioContext clock
  const playAudioQueue = () => {
    if (audioQueueRef.current.length === 0) return;

    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
      // Wire an analyser so drawVisualization can read the agent's audio
      const analyser = playbackContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(playbackContextRef.current.destination);
      playbackAnalyserRef.current = analyser;
      nextPlayTimeRef.current = 0;
    }

    const ctx = playbackContextRef.current;

    // Reset schedule if we've fallen behind or just started
    if (nextPlayTimeRef.current < ctx.currentTime) {
      nextPlayTimeRef.current = ctx.currentTime;
    }

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift()!;

      // Convert Int16 to Float32
      const float32Data = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        float32Data[i] = audioData[i] / 32768.0;
      }

      try {
        const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
        audioBuffer.copyToChannel(float32Data, 0);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        // Route through analyser — gapless playback AND visualization
        if (playbackAnalyserRef.current) {
          source.connect(playbackAnalyserRef.current);
        } else {
          source.connect(ctx.destination);
        }

        // Schedule at precise time — gapless playback, no clicks/pops
        source.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += audioBuffer.duration;
      } catch (e) {
        // Context was closed (user interrupted)
        break;
      }
    }
  };

  // Start capturing audio from microphone (used for visualization only — track is added to RTCPeerConnection)
  const startAudioCapture = async () => {
    // No-op: mic stream and RTCPeerConnection track are set up in connectToRealtime.
    // This function kept for compatibility with stopAudioCapture calls.
  };

  // Stop audio capture
  const stopAudioCapture = () => {
    if (vizFrameRef.current) {
      cancelAnimationFrame(vizFrameRef.current);
      vizFrameRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    playbackAnalyserRef.current = null;

    audioQueueRef.current = [];
  };

  // Disconnect from realtime API
  const disconnect = () => {
    if (dcRef.current) { dcRef.current.close(); dcRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (audioElRef.current) { audioElRef.current.srcObject = null; audioElRef.current = null; }
    stopAudioCapture();
    setConnectionState('disconnected');
    setSpeakingState('idle');
    greetingSentRef.current = false;
    currentResponseIdRef.current = null;
  };

  const handleClose = () => {
    disconnect();
    onClose();
  };

  if (!isOpen) return null;

  const isCallActive = connectionState === 'connected' || connectionState === 'connecting';
  const agentSpeaking = speakingState === 'ai_speaking';
  const userSpeaking  = speakingState === 'user_speaking';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4">
        <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800/60">

          {/* Header: timer + close */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <span className="font-mono text-sm text-gray-400">
              {connectionState === 'connected' ? formatDuration(callDuration) : '\u00A0'}
            </span>
            <button
              onClick={handleClose}
              className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 pb-7 flex flex-col items-center gap-4">

            {/* ── Agent side ── */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                {/* Ambient glow behind avatar */}
                {isCallActive && (
                  <div
                    className="absolute inset-[-12px] rounded-full transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)`,
                      opacity: agentSpeaking ? 1 : 0.2,
                    }}
                  />
                )}
                {/* Ping ring when agent speaking */}
                {agentSpeaking && (
                  <div
                    className="absolute inset-[-4px] rounded-full animate-ping"
                    style={{ background: accent.glow, animationDuration: '1.2s' }}
                  />
                )}
                {/* Avatar */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl relative z-10 shadow-lg transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${accent.color}99, ${accent.color}44)`,
                    boxShadow: agentSpeaking
                      ? `0 0 28px 8px ${accent.glow}`
                      : `0 0 10px 2px ${accent.glow.replace('0.35', '0.12')}`,
                    border: `2px solid ${accent.color}55`,
                  }}
                >
                  {agentIcon || '🤖'}
                </div>
              </div>
              <span className="text-white font-medium text-sm">{agentName}</span>
              <span
                className="text-xs transition-colors duration-200"
                style={{ color: agentSpeaking ? accent.color : 'rgb(107,114,128)' }}
              >
                {agentSpeaking
                  ? 'Speaking'
                  : connectionState === 'connected'
                    ? 'Listening'
                    : connectionState === 'connecting'
                      ? 'Calling…'
                      : 'Ready'}
              </span>
            </div>

            {/* ── Direction arrows ── */}
            {isCallActive && (
              <div className="flex flex-col items-center gap-0.5">
                {/* Agent → User (down arrow) — lit when agent speaking */}
                <svg
                  className="w-4 h-4 transition-all duration-200"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{
                    color: agentSpeaking ? accent.color : 'rgb(55,65,81)',
                    opacity: agentSpeaking ? 1 : 0.3,
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
                {/* User → Agent (up arrow) — lit when user speaking */}
                <svg
                  className="w-4 h-4 transition-all duration-200"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{
                    color: userSpeaking ? '#4ade80' : 'rgb(55,65,81)',
                    opacity: userSpeaking ? 1 : 0.3,
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              </div>
            )}

            {/* ── Frequency waveform canvas ── */}
            <canvas
              ref={canvasRef}
              width={280}
              height={56}
              className="rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />

            {/* ── User side ── */}
            {isCallActive && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  {userSpeaking && (
                    <div
                      className="absolute inset-[-4px] rounded-full bg-green-500/30 animate-ping"
                      style={{ animationDuration: '1s' }}
                    />
                  )}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center relative z-10 transition-all duration-300"
                    style={{
                      background: userSpeaking ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                      boxShadow: userSpeaking ? '0 0 20px 4px rgba(74,222,128,0.3)' : 'none',
                      border: `2px solid ${userSpeaking ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    <svg
                      className="w-6 h-6 transition-colors duration-200"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      style={{ color: userSpeaking ? '#4ade80' : 'rgb(156,163,175)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 116 0v4a3 3 0 11-6 0z"
                      />
                    </svg>
                  </div>
                </div>
                <span
                  className="text-xs transition-colors duration-200"
                  style={{ color: userSpeaking ? '#4ade80' : 'rgb(107,114,128)' }}
                >
                  {userSpeaking ? 'Speaking' : 'You'}
                </span>
              </div>
            )}

            {/* Error */}
            {errorMessage && (
              <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <p className="text-red-400 text-sm">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage('')}
                  className="text-red-300 text-xs mt-1 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* ── Call controls ── */}
            {!isCallActive ? (
              <div className="flex flex-col items-center gap-2 mt-2">
                <button
                  onClick={connectToRealtime}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ background: '#22c55e', boxShadow: '0 8px 24px rgba(34,197,94,0.4)' }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </button>
                <p className="text-gray-500 text-xs">Tap to call {agentName}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 mt-2">
                <button
                  onClick={handleClose}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ background: '#ef4444', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}
                >
                  <PhoneXMarkIcon className="w-8 h-8 text-white" />
                </button>
                <p className="text-gray-500 text-xs">End Call</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
