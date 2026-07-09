import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3005';

/**
 * GET /api/auth/google/callback — Proxy Google OAuth callback to backend
 * Google redirects here with ?code=...&state=...
 * We forward those query params + cookies to the backend, then follow its redirect
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code') || '';
    const state = searchParams.get('state') || '';

    const backendUrl = `${BACKEND_URL}/api/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

    // Forward cookies (oauth_state, oauth_redirect) to backend
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'X-Forwarded-Proto': 'https',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        Host: request.headers.get('host') || 'mumtaz.ai',
      },
      redirect: 'manual', // Don't follow redirects — we need to capture Set-Cookie headers
    });

    // Build the response (redirect) preserving backend's Set-Cookie headers
    const location = response.headers.get('location') || '/dashboard/overview';
    const nextResponse = NextResponse.redirect(new URL(location, request.url));

    // Copy all Set-Cookie headers from backend response
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      nextResponse.headers.append('Set-Cookie', cookie);
    }

    // Fallback for environments where getSetCookie isn't available
    if (setCookieHeaders.length === 0) {
      const rawSetCookie = response.headers.get('set-cookie');
      if (rawSetCookie) {
        // Split multiple Set-Cookie values (they may be joined)
        const cookies = rawSetCookie.split(/,(?=\s*\w+=)/);
        for (const cookie of cookies) {
          nextResponse.headers.append('Set-Cookie', cookie.trim());
        }
      }
    }

    return nextResponse;
  } catch (error) {
    console.error('[auth/google/callback] Error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url));
  }
}
