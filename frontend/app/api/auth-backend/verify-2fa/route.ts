import { AUTH_BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const backendBase = AUTH_BACKEND_URL;
    const body = await request.json();

    console.log('[auth-backend/verify-2fa] Proxying to backend:', backendBase);

    // Forward real client IP headers so the backend sees the actual user IP
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    const response = await fetch(`${backendBase}/api/auth/verify-2fa`, {
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
    console.log('[auth-backend/verify-2fa] Backend response status:', response.status, 'success:', data.success);

    // Create response with the same status
    const nextResponse = NextResponse.json(data, { status: response.status });

    // If verification was successful, set the session cookie properly
    if (response.ok && data.success && data.user) {
      // Parse the Set-Cookie header to get the session ID
      const setCookieHeader = response.headers.get('set-cookie');
      console.log('[auth-backend/verify-2fa] Set-Cookie header:', setCookieHeader);
      
      if (setCookieHeader) {
        // Extract sessionId value from the cookie header
        const allMatches = [...setCookieHeader.matchAll(/sessionId=([^;,\s]+)/g)];
        const sessionMatch = allMatches.length > 0 ? allMatches[allMatches.length - 1] : null;
        
        if (sessionMatch) {
          const sessionId = sessionMatch[1];
          console.log('[auth-backend/verify-2fa] Found', allMatches.length, 'sessionId cookies');
          console.log('[auth-backend/verify-2fa] Using last sessionId:', sessionId.substring(0, 10) + '... (length:', sessionId.length + ')');
          
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
          console.log('[auth-backend/verify-2fa] Could not parse sessionId from Set-Cookie');
        }
      } else {
        console.log('[auth-backend/verify-2fa] No Set-Cookie header from backend');
      }
    }

    return nextResponse;
  } catch (error) {
    console.error('Error proxying /api/auth-backend/verify-2fa:', error);
    return NextResponse.json(
      { success: false, message: '2FA verification failed - server error' },
      { status: 500 }
    );
  }
}
