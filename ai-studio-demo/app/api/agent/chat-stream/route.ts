import { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// AI STUDIO DEMO — Streaming Chat API (Self-contained)
// No external backend needed — calls AI providers directly.
// ═══════════════════════════════════════════════════════════════

function getApiKeys() {
  return {
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
    mistral: process.env.MISTRAL_API_KEY || '',
    xai: process.env.XAI_API_KEY || '',
    groq: process.env.GROQ_API_KEY || '',
    cerebras: process.env.CEREBRAS_API_KEY || '',
    gemini: process.env.GEMINI_API_KEY || '',
  };
}

// Stream from Anthropic (Claude)
async function streamAnthropic(apiKey: string, messages: any[], systemPrompt: string, maxTokens: number, temperature: number) {
  const anthropicMessages = messages.filter((m: any) => m.role !== 'system').map((m: any) => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : m.content,
  }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    }),
  });

  return response;
}

// Stream from OpenAI (GPT-4o)
async function streamOpenAI(apiKey: string, messages: any[], maxTokens: number, temperature: number) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
  });

  return response;
}

// Stream from Groq
async function streamGroq(apiKey: string, messages: any[], maxTokens: number, temperature: number) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
  });

  return response;
}

// Stream from Mistral
async function streamMistral(apiKey: string, messages: any[], maxTokens: number, temperature: number) {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
  });

  return response;
}

// Stream from xAI (Grok)
async function streamXAI(apiKey: string, messages: any[], maxTokens: number, temperature: number) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
  });

  return response;
}

// Stream from Cerebras
async function streamCerebras(apiKey: string, messages: any[], maxTokens: number, temperature: number) {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-4-scout-17b-16e-instruct',
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
  });

  return response;
}

// Parse Anthropic SSE stream
async function* parseAnthropicStream(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield parsed.delta.text;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

// Parse OpenAI-compatible SSE stream (works for OpenAI, Groq, Mistral, xAI, Cerebras)
async function* parseOpenAIStream(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

// Provider cascade order
const PROVIDER_CASCADE = ['anthropic', 'mistral', 'xai', 'groq', 'cerebras', 'openai'] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      conversationHistory = [],
      settings = {},
    } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKeys = getApiKeys();
    const temperature = settings.temperature ?? 0.7;
    const maxTokens = settings.maxTokens ?? 4096;
    const systemPrompt = settings.systemPrompt || 'You are a helpful AI assistant powered by One Last AI Demo. Be helpful, accurate, and conversational.';
    const preferredProvider = settings.provider || 'anthropic';

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of conversationHistory) {
      let content = msg.content;
      // Strip base64 data to prevent token overflow
      if (content && typeof content === 'string') {
        content = content.replace(/!\[([^\]]*)\]\(data:image\/[^)]+\)/g, '[Generated Image: $1]');
        content = content.replace(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]{100,}/g, '[image data removed]');
      }
      messages.push({ role: msg.role, content });
    }

    messages.push({ role: 'user', content: message });

    // Build provider order: preferred first, then cascade
    const providerOrder = [preferredProvider, ...PROVIDER_CASCADE.filter(p => p !== preferredProvider)];

    // Create SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let success = false;

        for (const provider of providerOrder) {
          const key = apiKeys[provider as keyof typeof apiKeys];
          if (!key) continue;

          try {
            let tokenStream: AsyncGenerator<string>;

            if (provider === 'anthropic') {
              const response = await streamAnthropic(key, messages, systemPrompt, maxTokens, temperature);
              if (!response.ok) {
                const errText = await response.text();
                console.error(`[demo] Anthropic error: ${response.status} ${errText}`);
                continue;
              }
              tokenStream = parseAnthropicStream(response);
            } else if (provider === 'openai') {
              const response = await streamOpenAI(key, messages, maxTokens, temperature);
              if (!response.ok) continue;
              tokenStream = parseOpenAIStream(response);
            } else if (provider === 'groq') {
              const response = await streamGroq(key, messages, maxTokens, temperature);
              if (!response.ok) continue;
              tokenStream = parseOpenAIStream(response);
            } else if (provider === 'mistral') {
              const response = await streamMistral(key, messages, maxTokens, temperature);
              if (!response.ok) continue;
              tokenStream = parseOpenAIStream(response);
            } else if (provider === 'xai') {
              const response = await streamXAI(key, messages, maxTokens, temperature);
              if (!response.ok) continue;
              tokenStream = parseOpenAIStream(response);
            } else if (provider === 'cerebras') {
              const response = await streamCerebras(key, messages, maxTokens, temperature);
              if (!response.ok) continue;
              tokenStream = parseOpenAIStream(response);
            } else {
              continue;
            }

            // Stream tokens to client
            for await (const token of tokenStream) {
              const sseData = `data: ${JSON.stringify({ token })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }

            // Done
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            success = true;
            break; // Provider succeeded, don't try others
          } catch (error: any) {
            console.error(`[demo] Provider ${provider} failed:`, error.message);
            continue; // Try next provider
          }
        }

        if (!success) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'All AI providers are unavailable. Please check API keys in .env.' })}\n\n`
            )
          );
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[demo] Chat stream error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
