'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SettingsPanel from './components/SettingsPanel';
import ChatBox from './components/ChatBox';
import NavigationDrawer from './components/NavigationDrawer';
import CanvasAppDrawer from './components/CanvasAppDrawer';
import Overlay from './components/Overlay';
import Footer from './components/Footer';
import { deviceTracker } from '../../services/deviceTrackingService';
import { ChatSession, Message, SettingsState, NavItem, CanvasState, WorkspaceMode } from './types';
import { DEFAULT_SETTINGS, NEURAL_PRESETS } from './constants';
import { streamMessage, formatConversationHistory } from './services/chatService';

// Gemini Live types (dynamically imported when needed)
type GoogleGenAIType = any;
type ModalityType = any;
type LiveServerMessageType = any;

const App: React.FC = () => {
  // UI State
  const [isOverlayActive, setIsOverlayActive] = useState(true);
  useEffect(() => { deviceTracker.start(); return () => { deviceTracker.stop(); }; }, []);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isCanvasDrawerOpen, setIsCanvasDrawerOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isRecordingSTT, setIsRecordingSTT] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [sttTranscript, setSttTranscript] = useState('');

  // Gemini Live & STT Refs
  const recognitionRef = useRef<any>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  // Default session for SSR and first load
  // Use static timestamp to avoid hydration mismatch
  const defaultSessions: ChatSession[] = [
    {
      id: '1',
      name: "PROTOCOL_INITIAL_CONTACT",
      active: true,
      messages: [
        { 
          id: 'init-1', 
          sender: 'AGENT', 
          text: 'Uplink established. Secure line verified. Neural link at 100% capacity. Workspace synchronized.', 
          timestamp: '--:--:-- --'  // Static for SSR, will be updated on client
        }
      ],
      settings: { ...DEFAULT_SETTINGS }
    }
  ];

  // App Data State - SSR safe
  const [sessions, setSessions] = useState<ChatSession[]>(defaultSessions);

  // DB-backed message feedback (like/dislike)
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'up' | 'down' | null>>({});

  // Load from DB on client-side mount, and fix initial timestamp
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (async () => {
        try {
          const res = await fetch('/api/user/preferences', { credentials: 'include' });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data?.chatHistory?.neural_sessions) {
              setSessions(json.data.chatHistory.neural_sessions);
            }
            // Load message feedback from DB
            if (json.success && json.data?.messageFeedback) {
              setMessageFeedback(json.data.messageFeedback);
            }
            // Load UI flags from DB
            if (json.success && json.data?.uiFlags) {
              const flags = json.data.uiFlags;
              setUiFlags(flags);
              if (typeof flags.neuralChatLeftPanel === 'boolean') setIsLeftPanelOpen(flags.neuralChatLeftPanel);
              if (typeof flags.neuralChatRightPanel === 'boolean') setIsRightPanelOpen(flags.neuralChatRightPanel);
            }
            if (json.success && json.data?.chatHistory?.neural_sessions) return;
          }
        } catch {
          // Keep defaults
        }
        // No saved sessions - update the default session with real timestamp
        setSessions(prev => prev.map(s => ({
          ...s,
          messages: s.messages.map(m => ({
            ...m,
            timestamp: m.timestamp === '--:--:-- --' ? new Date().toLocaleTimeString() : m.timestamp
          }))
        })));
      })();
    }
  }, []);

  // Save to DB when sessions change (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        fetch('/api/user/preferences', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatHistory: { neural_sessions: sessions } }),
        }).catch(() => {});
      }, 2000);
    }
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [sessions]);

  const activeSession = sessions.find(s => s.active) || sessions[0];

  const handleSend = async (text: string) => {
    if (isThinking) return;

    const timestamp = new Date().toLocaleTimeString();
    const userMsg: Message = { id: Date.now().toString(), sender: 'YOU', text, timestamp };

    setSessions(prev => prev.map(s =>
      s.active ? { ...s, messages: [...s.messages, userMsg] } : s
    ));

    setIsThinking(true);

    // Build conversation history for backend API
    const history = formatConversationHistory(
      activeSession.messages.map(m => ({ sender: m.sender, text: m.text }))
    );

    // Create an empty agent message now — tokens will fill it in incrementally
    const agentMsgId = (Date.now() + 1).toString();
    const agentMsg: Message = {
      id: agentMsgId,
      sender: 'AGENT',
      text: '',
      timestamp: new Date().toLocaleTimeString(),
    };

    setSessions(prev => prev.map(s =>
      s.active ? { ...s, messages: [...s.messages, agentMsg] } : s
    ));

    await streamMessage(
      text,
      activeSession.settings,
      history,
      (token) => {
        setSessions(prev => prev.map(s =>
          s.active
            ? { ...s, messages: s.messages.map(m => m.id === agentMsgId ? { ...m, text: m.text + token } : m) }
            : s
        ));
      },
      () => setIsThinking(false),
      (err) => {
        setSessions(prev => prev.map(s =>
          s.active
            ? { ...s, messages: s.messages.map(m => m.id === agentMsgId ? { ...m, text: `❌ ${err}` } : m) }
            : s
        ));
        setIsThinking(false);
      }
    );
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isCode = file.name.endsWith('.js') || file.name.endsWith('.py') || file.name.endsWith('.html') || file.name.endsWith('.css');
      
      let type: CanvasState['type'] = 'text';
      if (isImage) type = 'image';
      else if (isVideo) type = 'video';
      else if (isCode) type = 'code';

      updateActiveSettings({
        ...activeSession.settings,
        workspaceMode: 'CANVAS',
        canvas: {
          ...activeSession.settings.canvas,
          content: content,
          type: type,
          title: `UPLOAD_${file.name.toUpperCase()}`
        }
      });

      handleSend(`I have uploaded a file: ${file.name}. Please analyze it in the workspace.`);
    };

    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const toggleSTT = () => {
    if (isRecordingSTT) {
      recognitionRef.current?.stop();
      setIsRecordingSTT(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech Recognition not supported in this browser environment.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        // Collect all final results into the input field
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setSttTranscript(prev => (prev + ' ' + finalTranscript).trim());
        }
      };

      recognition.onend = () => setIsRecordingSTT(false);
      recognition.start();
      setIsRecordingSTT(true);
      recognitionRef.current = recognition;
    }
  };

  const toggleLive = async () => {
    if (isLiveActive) {
      liveSessionRef.current?.close();
      setIsLiveActive(false);
    } else {
      // Dynamic import of @google/genai — only loaded when Live Mode is triggered
      let GoogleGenAI: any, Modality: any;
      try {
        const genai = await import('@google/genai');
        GoogleGenAI = genai.GoogleGenAI;
        Modality = genai.Modality;
      } catch {
        alert('Gemini Live Mode requires @google/genai package. Feature not available.');
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
      setIsLiveActive(true);

      // Audio setup
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                
                const binary = new Uint8Array(int16.buffer);
                // Fix: Implemented manual audio encoding following GenAI SDK guidelines
                let bStr = '';
                for (let i = 0; i < binary.length; i++) bStr += String.fromCharCode(binary[i]);
                const base64 = btoa(bStr);

                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
                });
              };
              source.connect(scriptProcessor);
              // Do NOT connect scriptProcessor to destination — that would route mic to speakers (echo)
            },
            onmessage: async (message: any) => {
              const base64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64) {
                // Fix: Implemented manual audio decoding following GenAI SDK guidelines
                const binStr = atob(base64);
                const bytes = new Uint8Array(binStr.length);
                for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
                
                const dataInt16 = new Int16Array(bytes.buffer);
                const buffer = outputCtx.createBuffer(1, dataInt16.length, 24000);
                const channelData = buffer.getChannelData(0);
                for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

                const source = outputCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outputCtx.destination);
                
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }
              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onclose: () => setIsLiveActive(false),
            onerror: () => setIsLiveActive(false)
          },
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: activeSession.settings.customPrompt
          }
        });
        liveSessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Live failed:", err);
        setIsLiveActive(false);
      }
    }
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) return [
        { id: Date.now().toString(), name: "NEW_PROTOCOL", active: true, messages: [], settings: { ...DEFAULT_SETTINGS } }
      ];
      if (prev.find(s => s.id === id)?.active) filtered[0].active = true;
      return filtered;
    });
  };

  // DB-backed feedback handler
  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    const newValue = messageFeedback[messageId] === type ? null : type;
    setMessageFeedback(prev => ({ ...prev, [messageId]: newValue }));
    fetch('/api/user/preferences/message-feedback', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, feedback: newValue }),
    }).catch(() => {});
  };

  // Persist UI panel state to DB
  const saveUiFlag = (key: string, value: any) => {
    fetch('/api/user/preferences/ui-flags', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => {});
  };

  const toggleLeftPanel = () => {
    const next = !isLeftPanelOpen;
    setIsLeftPanelOpen(next);
    saveUiFlag('neuralChatLeftPanel', next);
  };

  const toggleRightPanel = () => {
    const next = !isRightPanelOpen;
    setIsRightPanelOpen(next);
    saveUiFlag('neuralChatRightPanel', next);
  };

  const handleApplyPreset = (type: string) => {
    const preset = NEURAL_PRESETS[type];
    if (!preset) return;
    updateActiveSettings({ ...activeSession.settings, customPrompt: preset.prompt, temperature: preset.temp });
  };

  const createNewSession = () => {
    const id = Date.now().toString();
    const newSession: ChatSession = {
      id, name: `PROTOCOL_LOG_${id.slice(-4)}`, active: true, 
      messages: [{ id: `init-${id}`, sender: 'AGENT', text: 'New neural channel opened. Workspace ready.', timestamp: new Date().toLocaleTimeString() }],
      settings: { ...DEFAULT_SETTINGS }
    };
    setSessions(prev => prev.map(s => ({ ...s, active: false })).concat(newSession));
  };

  const selectSession = (id: string) => {
    setSessions(prev => prev.map(s => ({ ...s, active: s.id === id })));
  };

  const updateActiveSettings = (settings: SettingsState) => {
    setSessions(prev => prev.map(s => s.active ? { ...s, settings } : s));
  };

  return (
    <div className="matrix-bg text-gray-300 h-screen flex flex-col overflow-hidden relative selection:bg-green-500/30 selection:text-white font-mono">
      <Overlay active={isOverlayActive} onActivate={() => setIsOverlayActive(false)} />
      <div className={`flex flex-col h-full transition-opacity duration-300 ${(isNavDrawerOpen || isCanvasDrawerOpen) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Header 
          onToggleLeft={toggleLeftPanel} 
          onToggleRight={toggleRightPanel}
          onToggleNav={() => setIsNavDrawerOpen(!isNavDrawerOpen)}
          onToggleCanvas={() => setIsCanvasDrawerOpen(true)}
          onClear={() => setSessions(prev => prev.map(s => s.active ? { ...s, messages: [] } : s))}
          onLock={() => setIsOverlayActive(true)}
          leftOpen={isLeftPanelOpen} rightOpen={isRightPanelOpen}
        />
        <div className="flex-grow flex relative overflow-hidden z-10">
          {(isLeftPanelOpen || isRightPanelOpen) && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[50] transition-opacity animate-in fade-in duration-300" onClick={() => { setIsLeftPanelOpen(false); setIsRightPanelOpen(false); saveUiFlag('neuralChatLeftPanel', false); saveUiFlag('neuralChatRightPanel', false); }}></div>
          )}
          <Sidebar sessions={sessions} onSelect={selectSession} onCreate={createNewSession} onDelete={deleteSession} isOpen={isLeftPanelOpen} />
          <ChatBox 
            messages={activeSession.messages} isThinking={isThinking}
            isRecordingSTT={isRecordingSTT} isLiveActive={isLiveActive}
            sttTranscript={sttTranscript} onSttTranscriptUsed={() => setSttTranscript('')}
            onSend={handleSend} onFileUpload={handleFileUpload}
            onToggleSTT={toggleSTT} onToggleLive={toggleLive}
            agentSettings={activeSession.settings} onUpdateSettings={updateActiveSettings}
            messageFeedback={messageFeedback}
            onFeedback={handleFeedback}
          />
          <SettingsPanel settings={activeSession.settings} onChange={updateActiveSettings} onApplyPreset={handleApplyPreset} onReset={() => updateActiveSettings({ ...activeSession.settings, ...DEFAULT_SETTINGS })} isOpen={isRightPanelOpen} />
        </div>
        <Footer />
      </div>
      <NavigationDrawer 
        isOpen={isNavDrawerOpen} 
        onClose={() => setIsNavDrawerOpen(false)} 
        currentSettings={activeSession.settings}
        onSettingsChange={updateActiveSettings}
        onModuleSelect={(item: NavItem) => {
          // Handle Canvas App - open the canvas drawer
          if (item.tool === 'canvas_app') {
            setIsNavDrawerOpen(false);
            setTimeout(() => setIsCanvasDrawerOpen(true), 300);
            return;
          }
          
          let mode: WorkspaceMode = 'CHAT';
          if (item.tool === 'browser') mode = 'PORTAL';
          else if (item.tool === 'canvas') mode = 'CANVAS';
          updateActiveSettings({ ...activeSession.settings, activeTool: item.tool, workspaceMode: mode });
          setIsNavDrawerOpen(false);
      }} />
      <CanvasAppDrawer isOpen={isCanvasDrawerOpen} onClose={() => setIsCanvasDrawerOpen(false)} />
    </div>
  );
};

export default App;
