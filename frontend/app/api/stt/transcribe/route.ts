import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Dedicated voice keys take priority
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const OPENAI_API_KEY =
  process.env.OPENAI_VOICE_API_KEY || process.env.OPENAI_API_KEY;

// Supported audio MIME types
const SUPPORTED_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/flac',
  'audio/webm',
  'audio/ogg',
]);

/**
 * POST /api/stt/transcribe
 * Premium speech-to-text using Deepgram Nova-2 (primary) or OpenAI Whisper (fallback).
 *
 * Accepts:
 *   - multipart/form-data with a "file" field
 *   - raw audio body with Content-Type header
 *
 * Query params (optional):
 *   - language: ISO language code (default: "en", "auto" for detection)
 *   - diarize: "true" to enable speaker diarization
 */
export async function POST(request: NextRequest) {
  if (!DEEPGRAM_API_KEY && !OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'No STT provider configured (set DEEPGRAM_API_KEY or OPENAI_API_KEY)' },
      { status: 500 }
    );
  }

  try {
    // Extract audio from request
    let audioBuffer: ArrayBuffer;
    let contentType = 'audio/mpeg';
    let filename = 'audio.mp3';

    const reqContentType = request.headers.get('content-type') || '';

    if (reqContentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      audioBuffer = await file.arrayBuffer();
      contentType = file.type || 'audio/mpeg';
      filename = file.name || 'audio.mp3';
    } else {
      // Raw audio body
      audioBuffer = await request.arrayBuffer();
      contentType = reqContentType.split(';')[0].trim();
    }

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Empty audio data' }, { status: 400 });
    }

    // 50MB limit
    if (audioBuffer.byteLength > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file too large (max 50MB)' }, { status: 413 });
    }

    const language = request.nextUrl.searchParams.get('language') || 'en';
    const diarize = request.nextUrl.searchParams.get('diarize') === 'true';

    // ── Primary: Deepgram Nova-2 ──
    if (DEEPGRAM_API_KEY) {
      const dgParams = new URLSearchParams({
        model: 'nova-2',
        smart_format: 'true',
        punctuate: 'true',
        paragraphs: 'true',
        utterances: 'true',
        ...(diarize ? { diarize: 'true' } : {}),
        ...(language === 'auto'
          ? { detect_language: 'true' }
          : { language }),
      });

      const dgResponse = await fetch(
        `https://api.deepgram.com/v1/listen?${dgParams.toString()}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${DEEPGRAM_API_KEY}`,
            'Content-Type': contentType,
          },
          body: Buffer.from(audioBuffer),
        }
      );

      if (dgResponse.ok) {
        const result = await dgResponse.json();
        const alt = result.results?.channels?.[0]?.alternatives?.[0];
        const transcript = alt?.transcript || '';
        const confidence = alt?.confidence || 0;
        const words = alt?.words || [];
        const duration = result.metadata?.duration || 0;
        const detectedLanguage =
          result.results?.channels?.[0]?.detected_language || language;

        return NextResponse.json({
          success: true,
          text: transcript,
          language: detectedLanguage,
          confidence: Math.round(confidence * 100),
          duration: Math.round(duration),
          words: words.length,
          provider: 'deepgram-nova-2',
          ...(diarize && words.length > 0
            ? {
                speakers: [
                  ...new Set(words.map((w: { speaker?: number }) => w.speaker)),
                ].filter((s) => s !== undefined).length,
              }
            : {}),
        });
      }

      console.warn('[Deepgram STT] Error:', dgResponse.status, 'falling back to Whisper');
    }

    // ── Fallback: OpenAI Whisper ──
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Deepgram failed and no fallback configured' },
        { status: 502 }
      );
    }

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([audioBuffer], { type: contentType }),
      filename
    );
    formData.append('model', 'whisper-1');
    if (language !== 'auto') {
      formData.append('language', language);
    }
    formData.append('response_format', 'verbose_json');

    const whisperResponse = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: formData,
      }
    );

    if (!whisperResponse.ok) {
      return NextResponse.json(
        { error: `Whisper API error: ${whisperResponse.status}` },
        { status: 502 }
      );
    }

    const result = await whisperResponse.json();

    return NextResponse.json({
      success: true,
      text: result.text,
      language: result.language || language,
      duration: Math.round(result.duration || 0),
      words: result.text?.split(/\s+/).filter(Boolean).length || 0,
      provider: 'openai-whisper',
    });
  } catch (error) {
    console.error('[STT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
