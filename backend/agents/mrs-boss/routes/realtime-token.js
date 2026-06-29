/**
 * REALTIME VOICE TOKEN ROUTE — OpenAI Realtime API ephemeral token
 * Each agent handles its own voice token with its own prompt + voice.
 * Frontend calls /api/agent/{agentId}/realtime/token → nginx → this agent's port → here
 */

import express from 'express';
import { STRICT_AGENT_PROMPTS } from '../lib/agent-strict-prompts.js';

const router = express.Router();

const AGENT_VOICE_MAP = {
  'julie-girlfriend': 'shimmer', 'emma-emotional': 'shimmer', 'drama-queen': 'verse',
  'mrs-boss': 'marin', 'chef-biew': 'coral', 'professor-astrology': 'shimmer',
  'einstein': 'sage', 'chess-player': 'cedar', 'knight-logic': 'sage',
  'comedy-king': 'echo', 'rook-jokey': 'echo', 'lazy-pawn': 'alloy',
  'tech-wizard': 'ash', 'ben-sega': 'ballad', 'bishop-burger': 'ballad',
  'fitness-guru': 'ash', 'travel-buddy': 'echo', 'nid-gaming': 'echo',
};

router.post('/', async (req, res) => {
  const apiKey = process.env.OPENAI_VOICE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });

  try {
    const agentId = process.env.AGENT_ID || '';
    const voice = AGENT_VOICE_MAP[agentId] || 'alloy';

    const agentPrompt = STRICT_AGENT_PROMPTS[agentId] || '';
    const instructions = agentPrompt
      ? `${agentPrompt}\n\nIMPORTANT: You MUST always speak and respond in English. Never switch to another language unless the user explicitly asks you to.`
      : 'You are a helpful AI assistant. Be conversational, friendly, and concise. Always speak in English.';

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice,
        instructions,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500 },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error(`[${agentId}/realtime-token] OpenAI error:`, err);
      return res.status(response.status).json({ error: err.message || 'Failed to create session' });
    }

    const session = await response.json();
    res.json({
      token: session.client_secret?.value,
      wsUrl: 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
      sessionId: session.id,
    });
  } catch (err) {
    console.error('[realtime-token] Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
