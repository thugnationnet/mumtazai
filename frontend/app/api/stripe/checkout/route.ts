export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyRequest,
  unauthorizedResponse,
} from '../../../../lib/validateAuth';

// All checkout sessions are created by universal-chat-backend (port 3008)
const BACKEND_URL = process.env.CHAT_BACKEND_URL || 'http://127.0.0.1:3008';

/**
 * Proxy to universal-chat-backend for Stripe checkout session creation
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = verifyRequest(request);
    if (!authResult.ok) return unauthorizedResponse(authResult.error);

    const body = await request.json();

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/stripe/checkout`,
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
    console.error('❌ Checkout proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'fetch failed',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
