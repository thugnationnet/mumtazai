/**
 * EMOTIONAL TTS INTEGRATION EXAMPLE
 * How to integrate emotional TTS with chat components
 */

'use client';

import { useState } from 'react';
import {
  useEmotionalTTS,
  useAgentPersonality,
} from '@/lib/emotional-tts-client';
import { EmotionalTTSConfig } from '@/lib/emotional-tts-service';

interface EmotionalChatProps {
  agentId: string;
  agentName: string;
}

export function EmotionalChatDemo({ agentId, agentName }: EmotionalChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<
    Array<{ text: string; emotion: string; provider: string }>
  >([]);

  const { speakAndPlay, loading, isPlaying, error, test } =
    useEmotionalTTS(agentId);
  const { personality } = useAgentPersonality(agentId);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      // Speak with auto-detected emotion
      const result = await speakAndPlay(message);

      setMessages((prev) => [
        ...prev,
        {
          text: message,
          emotion: result?.emotion || 'neutral',
          provider: result?.provider || 'unknown',
        },
      ]);

      setMessage('');
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  const testVoice = async () => {
    try {
      await test();
    } catch (err) {
      console.error('Test error:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Agent Info */}
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {agentName} - Emotional Voice Demo
        </h2>

        {personality && (
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              Gender: <span className="font-medium">{personality.gender}</span>
            </div>
            <div>
              Base Emotion:{' '}
              <span className="font-medium">{personality.baseEmotion}</span>
            </div>
            <div>
              Style:{' '}
              <span className="font-medium">{personality.defaultStyle}</span>
            </div>
            <div>
              Providers:{' '}
              <span className="font-medium">
                {Object.keys(personality.providers).length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Emotion Tips */}
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Emotion Tips:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Use emojis: "I love you! 💖" → romantic</li>
          <li>• Use caps: "AMAZING!" → excited</li>
          <li>• Use exclamations: "Great!!!" → joyful</li>
          <li>• Use questions: "How are you?" → conversational</li>
        </ul>
      </div>

      {/* Message Input */}
      <div className="mb-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Type a message for ${agentName} to speak...`}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          disabled={loading || isPlaying}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleSend}
          disabled={loading || isPlaying || !message.trim()}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white 
                   rounded-lg font-medium transition-colors disabled:opacity-50 
                   disabled:cursor-not-allowed"
        >
          {loading && '⏳ Generating...'}
          {isPlaying && '🔊 Speaking...'}
          {!loading && !isPlaying && '🎤 Speak with Emotion'}
        </button>

        <button
          onClick={testVoice}
          disabled={loading || isPlaying}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white 
                   rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          🧪 Test Voice
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-800 dark:text-red-400">❌ Error: {error}</p>
        </div>
      )}

      {/* Message History */}
      {messages.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Recent Messages:
          </h3>
          {messages.map((msg, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-900 dark:text-white mb-1">{msg.text}</p>
              <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  Emotion:{' '}
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {msg.emotion}
                  </span>
                </span>
                <span>
                  Provider:{' '}
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {msg.provider}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ADVANCED USAGE EXAMPLE
 * Manual emotion and style control
 */

export function AdvancedEmotionalTTS({ agentId }: { agentId: string }) {
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState<string>('neutral');
  const [style, setStyle] = useState<string>('conversational');
  const [intensity, setIntensity] = useState(0.5);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);

  const { speak, speakAndPlay, loading, isPlaying } = useEmotionalTTS(agentId);

  const handleSpeak = async () => {
    const config: Partial<EmotionalTTSConfig> = {
      emotion: emotion as any,
      style: style as any,
      intensity,
      speed,
      pitch,
    };

    await speakAndPlay(text, config);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Advanced Emotion Control
      </h2>

      {/* Text Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Text to Speak:
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          rows={3}
        />
      </div>

      {/* Emotion Selection */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Emotion:
          </label>
          <select
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="neutral">Neutral</option>
            <option value="happy">Happy</option>
            <option value="joyful">Joyful</option>
            <option value="excited">Excited</option>
            <option value="romantic">Romantic</option>
            <option value="dramatic">Dramatic</option>
            <option value="sad">Sad</option>
            <option value="angry">Angry</option>
            <option value="calm">Calm</option>
            <option value="energetic">Energetic</option>
            <option value="professional">Professional</option>
            <option value="empathetic">Empathetic</option>
            <option value="funny">Funny</option>
            <option value="mysterious">Mysterious</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Speaking Style:
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="conversational">Conversational</option>
            <option value="narration">Narration</option>
            <option value="customerservice">Customer Service</option>
            <option value="newscast">Newscast</option>
            <option value="cheerful">Cheerful</option>
            <option value="excited">Excited</option>
            <option value="friendly">Friendly</option>
          </select>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Intensity: {intensity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Speed: {speed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pitch: {pitch > 0 ? '+' : ''}
            {pitch}
          </label>
          <input
            type="range"
            min="-10"
            max="10"
            step="1"
            value={pitch}
            onChange={(e) => setPitch(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Speak Button */}
      <button
        onClick={handleSpeak}
        disabled={loading || isPlaying || !text.trim()}
        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white 
                 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {loading && '⏳ Generating...'}
        {isPlaying && '🔊 Speaking...'}
        {!loading && !isPlaying && '🎤 Speak with Custom Settings'}
      </button>
    </div>
  );
}

/**
 * SIMPLE INTEGRATION WITH EXISTING CHAT
 */

export function SimpleTTSButton({
  text,
  agentId,
}: {
  text: string;
  agentId: string;
}) {
  const { speakAndPlay, isPlaying } = useEmotionalTTS(agentId);

  return (
    <button
      onClick={() => speakAndPlay(text)}
      disabled={isPlaying}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
      title="Speak message"
    >
      {isPlaying ? '🔊' : '🔉'}
    </button>
  );
}
