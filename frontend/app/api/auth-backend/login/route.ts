import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const backendBase = process.env.AUTH_BACKEND_URL || 'http://127.0.0.1:3005';
    const body = await request.json();

    console.log('[auth-backend/login] Proxying to backend:', backendBase);

    // Forward real client IP headers so the backend sees the actual user IP
    // (nginx sets these, but without forwarding them here the backend sees 127.0.0.1)
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    const response = await fetch(`${backendBase}/api/auth/login`, {
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
    console.log('[auth-backend/login] Backend response status:', response.status, 'success:', data.success);

    // Create response with the same status
    const nextResponse = NextResponse.json(data, { status: response.status });

    // If login was successful, forward ALL Set-Cookie headers from backend.
    // The backend sets: sessionId, session_id, neural_link_session (JWT), neural_token
    // ALL must reach the browser for cross-backend auth to work.
    if (response.ok && data.success) {
      // Forward ALL Set-Cookie headers from backend to browser
      // Backend already sets correct domain (.mumtaz.ai), path, httpOnly, secure, sameSite
      const setCookies: string[] = (response.headers as any).getSetCookie?.() || [];
      
      if (setCookies.length > 0) {
        for (const cookie of setCookies) {
          nextResponse.headers.append('Set-Cookie', cookie);
        }
        console.log('[auth-backend/login] Forwarded', setCookies.length, 'Set-Cookie headers from backend');
      } else {
        // Fallback: read raw combined set-cookie header
        const rawSetCookie = response.headers.get('set-cookie');
        if (rawSetCookie) {
          // Split combined cookies on comma followed by a cookie name
          const cookies = rawSetCookie.split(/,\s*(?=[a-zA-Z_]+=)/);
          for (const cookie of cookies) {
            nextResponse.headers.append('Set-Cookie', cookie.trim());
          }
          console.log('[auth-backend/login] Forwarded', cookies.length, 'cookies from raw header');
        } else {
          console.log('[auth-backend/login] No Set-Cookie header from backend');
        }
      }
      // NOTE: Do NOT clear hostname-scoped cookies here - backend handles it properly
      // Clearing here would create duplicate empty cookies that break session resolution
    }

    return nextResponse;
  } catch (error) {
    console.error('Error proxying /api/auth-backend/login:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed - server error' },
      { status: 500 }
    );
  }
}
