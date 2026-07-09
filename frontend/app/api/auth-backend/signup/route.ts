import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const backendBase = process.env.AUTH_BACKEND_URL || 'http://127.0.0.1:3005';
    const body = await request.json();

    console.log('[auth-backend/signup] Proxying to backend:', backendBase);

    // Forward real client IP headers so the backend sees the actual user IP
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    const response = await fetch(`${backendBase}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
        'x-forwarded-for': clientIp,
        'x-real-ip': request.headers.get('x-real-ip') || clientIp.split(',')[0]?.trim() || '',
        'user-agent': request.headers.get('user-agent') || '',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json();
    console.log('[auth-backend/signup] Backend response status:', response.status, 'success:', data.success);

    // Create response with the same status
    const nextResponse = NextResponse.json(data, { status: response.status });

    // If signup was successful, set the session cookie properly
    // The backend returns the session in the response, but we need to set
    // the cookie from the frontend domain for it to work correctly
    if (response.ok && data.success) {
      // Parse the Set-Cookie header to get the session ID
      const setCookieHeader = response.headers.get('set-cookie');
      console.log('[auth-backend/signup] Set-Cookie header:', setCookieHeader);
      
      if (setCookieHeader) {
        // Extract sessionId value from the cookie header
        // The backend may return multiple sessionId cookies - we need the LAST one (64-char hex)
        // which is the real session saved in the database by the signup handler
        const allMatches = [...setCookieHeader.matchAll(/sessionId=([^;,\s]+)/g)];
        // Get the last match, which is the actual session from the signup handler
        const sessionMatch = allMatches.length > 0 ? allMatches[allMatches.length - 1] : null;
        if (sessionMatch) {
          const sessionId = sessionMatch[1];
          console.log('[auth-backend/signup] Found', allMatches.length, 'sessionId cookies');
          console.log('[auth-backend/signup] Using last sessionId:', sessionId.substring(0, 10) + '... (length:', sessionId.length + ')');
          
          // Determine if we're in production (HTTPS)
          const isProduction = request.headers.get('x-forwarded-proto') === 'https' || 
                              request.url.startsWith('https://');
          
          // Set both cookie names for compatibility
          // Set cookies WITH domain to match backend and prevent duplicate cookies
          const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;
          nextResponse.cookies.set('sessionId', sessionId, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
            ...(cookieDomain && { domain: cookieDomain }),
          });
          nextResponse.cookies.set('session_id', sessionId, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
            ...(cookieDomain && { domain: cookieDomain }),
          });
          // NOTE: Do NOT clear hostname-scoped cookies here - backend handles it properly
        } else {
          console.log('[auth-backend/signup] Could not parse sessionId from Set-Cookie');
        }
      } else {
        console.log('[auth-backend/signup] No Set-Cookie header from backend');
      }
    }

    return nextResponse;
  } catch (error) {
    console.error('Error proxying /api/auth-backend/signup:', error);
    return NextResponse.json(
      { success: false, message: 'Signup failed - server error' },
      { status: 500 }
    );
  }
}
