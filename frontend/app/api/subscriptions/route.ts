import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest, unauthorizedResponse } from '../../../lib/validateAuth';

// Use chat backend for subscription routes (port 3008 in production)
const BACKEND_BASE =
  process.env.CHAT_BACKEND_URL || process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3005';

async function proxy(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const backendPath =
      url.pathname.replace(
        '/api/subscriptions',
        '/api/agent/subscriptions/user'
      ) + url.search;
    const backendUrl = `${BACKEND_BASE}${backendPath}`;

    const init: RequestInit = {
      method: request.method,
      headers: Object.fromEntries(request.headers),
      body: undefined,
    };

    // Require authentication for subscription endpoints
    const authResult = verifyRequest(request);
    if (!authResult.ok) return unauthorizedResponse(authResult.error);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.text();
    }

    const res = await fetch(backendUrl, init);
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: res.headers as any,
    });
  } catch (err: any) {
    console.error('[/api/subscriptions] Proxy error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Proxy error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxy(request);
}
