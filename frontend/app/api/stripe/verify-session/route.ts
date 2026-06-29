export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// Use chat backend for subscription routes (port 3008 in production)
const BACKEND_URL = process.env.CHAT_BACKEND_URL || 'http://127.0.0.1:3008';

function resolveBackendUrl(_slug?: string) {
  // All verify-session calls go to universal-chat-backend (3008) — it handles all agents
  return BACKEND_URL;
}

/**
 * Proxy to backend for Stripe session verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendBaseUrl = resolveBackendUrl(body?.slug);

    const backendResponse = await fetch(
      `${backendBaseUrl}/api/stripe/verify-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      }
    );

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'fetch failed',
      },
      { status: 500 }
    );
  }
}
