import { NextResponse } from 'next/server';

// Stub: Canvas agent-stream not available in demo
export async function POST() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ token: '🚫 Canvas build is not available in the demo version. Visit [mumtaz.ai](https://mumtaz.ai) and sign up for full access to the AI Canvas Builder.' })}\n\n`
        )
      );
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
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
}
