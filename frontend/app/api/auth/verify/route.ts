import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function proxyToBackend(request: NextRequest) {
  const backendBase = process.env.BACKEND_BASE_URL || process.env.BACKEND_URL || 'http://127.0.0.1:3005';

  const incomingUrl = new URL(request.url);
  // Backend uses /api/auth/session for session verification
  const targetUrl = new URL('/api/auth/session', backendBase);

  // Forward query parameters if any
  incomingUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Backend returned an error status
      console.warn(`[auth/verify] Backend returned status ${response.status}`);
      return NextResponse.json(
        { valid: false, success: false, message: 'Session verification failed' },
        { status: 200 } // Return 200 to client, just mark as invalid
      );
    }

    const data = await response.json();
    
    // Transform backend response to match frontend expectations
    // Backend returns: { success: boolean, user: object|null }
    // Frontend expects: { valid: boolean, user: object|null }
    const transformedResponse = {
      valid: data.success && data.user !== null,
      success: data.success,
      user: data.user,
    };

    return NextResponse.json(transformedResponse, {
      status: 200,
    });
  } catch (fetchError) {
    console.error('[auth/verify] Backend connection failed:', fetchError);
    // Return invalid session but with 200 status to prevent client errors
    return NextResponse.json(
      { valid: false, success: false, message: 'Backend unavailable' },
      { status: 200 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return await proxyToBackend(request);
  } catch (error) {
    console.error('Error proxying /api/auth/verify:', error);
    return NextResponse.json(
      { valid: false, success: false, message: 'Session verification failed' },
      { status: 200 } // Return 200 to prevent client console errors
    );
  }
}

// Keep POST for AuthContext compatibility; proxy as well.
export async function POST(request: NextRequest) {
  return GET(request);
}
