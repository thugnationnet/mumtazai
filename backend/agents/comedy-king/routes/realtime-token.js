/**
 * REALTIME VOICE — OpenAI WebRTC SDP proxy
 * OpenAI's Realtime API now uses WebRTC (WHIP-style SDP exchange).
 * The /v1/realtime/sessions ephemeral-token endpoint is deprecated.
 *
 * Flow:
 *   1. Frontend creates RTCPeerConnection and generates an SDP offer
 *   2. Frontend POST /api/agent/realtime/token  { offer: "<sdp>" }
 *   3. This backend forwards the offer to OpenAI with the API key
 *   4. OpenAI returns an SDP answer
 *   5. Frontend sets the remote description → WebRTC call starts
 *
 * Nginx routes: /api/agent/{agentId}/realtime/* → this port
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

const REALTIME_MODEL = 'gpt-realtime';

router.post('/', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });

  const agentId = process.env.AGENT_ID || '';
  const voice   = AGENT_VOICE_MAP[agentId] || 'alloy';

  // Build system instructions
  const agentPrompt = STRICT_AGENT_PROMPTS[agentId] || '';
  const instructions = agentPrompt
    ? `${agentPrompt}\n\nIMPORTANT: You MUST always speak and respond in English.`
    : 'You are a helpful AI assistant. Be conversational, friendly, and concise.';

  // ── WebRTC SDP-proxy flow ──────────────────────────────────────────────────
  const { offer } = req.body;

  if (offer) {
    // Client sent an SDP offer — forward it to OpenAI and return the SDP answer
    try {
      const url = `https://api.openai.com/v1/realtime?model=${REALTIME_MODEL}&voice=${voice}`;
      const sdpRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/sdp',
        },
        body: offer,
      });

      if (!sdpRes.ok) {
        const errText = await sdpRes.text();
        console.error(`[${agentId}/realtime] OpenAI SDP error (${sdpRes.status}):`, errText);
        return res.status(sdpRes.status).json({ error: 'Failed to create WebRTC session with OpenAI' });
      }

      const answerSdp = await sdpRes.text();
      console.log(`[${agentId}/realtime] WebRTC session created`);
      return res.json({ answer: answerSdp, voice, agentId });
    } catch (err) {
      console.error(`[${agentId}/realtime] SDP proxy error:`, err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── No SDP offer: return session config for the frontend to initiate WebRTC ─
  res.json({
    model: REALTIME_MODEL,
    voice,
    agentId,
    instructions,
    wsUrl: null, // WebSocket no longer used; use WebRTC SDP flow above
    sdpEndpoint: '/api/agent/realtime/token', // POST with { offer } to get { answer }
    turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500 },
  });
});

export default router;
