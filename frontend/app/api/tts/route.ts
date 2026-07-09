import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Provider Keys (dedicated voice keys take priority) ──
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'southeastasia';
const ELEVENLABS_API_KEY =
  process.env.ELEVENLABS_VOICE_API_KEY || process.env.ELEVENLABS_API_KEY;
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // "Sarah" - clear female voice

// ── Azure Neural HD Voices ──
// Latest generation — studio-quality, ultra-realistic
const AZURE_VOICES = {
  female: 'en-US-AvaMultilingualNeural',    // Most natural female
  male: 'en-US-AndrewMultilingualNeural',   // Most natural male
} as const;

// Map ElevenLabs voice IDs to gender for Azure fallback selection
const ELEVENLABS_FEMALE_IDS = new Set([
  'EXAVITQu4vr4xnSDxMaL', // Sarah
  '21m00Tcm4TlvDq8ikWAM', // Rachel
  'AZnzlk1XvdvUeBnXmlld', // Domi
  'MF3mGyEYCl7XYWbV9V6O', // Elli
]);

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Azure Neural TTS — Premium HD ──
async function synthesizeWithAzure(
  text: string,
  gender: 'female' | 'male' = 'female'
): Promise<ArrayBuffer | null> {
  if (!AZURE_SPEECH_KEY) return null;

  const voiceName = AZURE_VOICES[gender];
  const endpoint = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

  // SSML with conversational style for natural speech
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
  <voice name='${voiceName}'>
    <mstts:express-as style='chat'>
      ${escapeXml(text)}
    </mstts:express-as>
  </voice>
</speak>`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3',
        'User-Agent': 'OnelastAI-TTS/1.0',
      },
      body: ssml,
    });

    if (!response.ok) {
      console.error('[Azure TTS] Error:', response.status, await response.text().catch(() => ''));
      return null;
    }

    console.log(`[Azure TTS] ${voiceName} — ${text.length} chars → audio`);
    return await response.arrayBuffer();
  } catch (error) {
    console.error('[Azure TTS] Request failed:', error);
    return null;
  }
}

// ── ElevenLabs v2 — Premium Fallback ──
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function synthesizeWithElevenLabs(
  text: string,
  voiceId: string,
  maxRetries: number = 3
): Promise<ArrayBuffer | null> {
  if (!ELEVENLABS_API_KEY) return null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_192`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.3,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log(`[ElevenLabs] Rate limited, attempt ${attempt + 1}/${maxRetries}`);
        await delay(1000 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        console.error('[ElevenLabs] Error:', response.status);
        return null;
      }

      console.log(`[ElevenLabs v2] voice=${voiceId} — ${text.length} chars → audio`);
      return await response.arrayBuffer();
    } catch (error) {
      console.error('[ElevenLabs] Request failed:', error);
      return null;
    }
  }

  return null;
}

// ══════════════════════════════════════════════════════════
// POST /api/tts — Multi-provider premium TTS
// Priority: Azure Neural HD → ElevenLabs v2
// ══════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  if (!AZURE_SPEECH_KEY && !ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { message: 'No TTS provider configured (set AZURE_SPEECH_KEY or ELEVENLABS_API_KEY)' },
      { status: 500 }
    );
  }

  try {
    const { text, voiceId } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ message: 'text is required' }, { status: 400 });
    }

    const trimmedText = text.slice(0, 5000);
    const selectedVoice = voiceId || DEFAULT_VOICE_ID;
    const gender = ELEVENLABS_FEMALE_IDS.has(selectedVoice) ? 'female' : 'male';

    // 1. Try Azure Neural HD (lowest latency, highest quality)
    const azureAudio = await synthesizeWithAzure(trimmedText, gender);
    if (azureAudio && azureAudio.byteLength > 0) {
      return new NextResponse(azureAudio, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': azureAudio.byteLength.toString(),
          'X-TTS-Provider': 'azure-neural-hd',
        },
      });
    }

    // 2. Fallback to ElevenLabs v2
    const elevenAudio = await synthesizeWithElevenLabs(trimmedText, selectedVoice);
    if (elevenAudio && elevenAudio.byteLength > 0) {
      return new NextResponse(elevenAudio, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': elevenAudio.byteLength.toString(),
          'X-TTS-Provider': 'elevenlabs-v2',
        },
      });
    }

    return NextResponse.json(
      { message: 'All TTS providers failed' },
      { status: 502 }
    );
  } catch (error) {
    console.error('[TTS] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
