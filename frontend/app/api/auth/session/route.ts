import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/session
 * Proxies to backend /api/auth/session for session verification.
 * Used by canvas-studio and any client that needs to check session status.
 * Returns: { success: boolean, user: { id, email, name, avatar } | null }
 */
export async function GET(request: NextRequest) {
  const backendBase =
    process.env.BACKEND_BASE_URL ||
    process.env.BACKEND_URL ||
    'http://127.0.0.1:3005';

  const targetUrl = new URL('/api/auth/session', backendBase);

  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    // Forward the backend response as-is
    const res = NextResponse.json(data, { status: response.ok ? 200 : response.status });

    // Forward set-cookie headers if backend refreshes session
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.headers.set('set-cookie', setCookie);
    }

    return res;
  } catch (error) {
    console.error('[auth/session] Backend connection failed:', error);
    return NextResponse.json(
      { success: false, user: null, message: 'Backend unavailable' },
      { status: 200 }
    );
  }
}
