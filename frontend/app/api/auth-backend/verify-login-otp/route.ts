import { AUTH_BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const backendBase = AUTH_BACKEND_URL;
    const body = await request.json();

    console.log('[auth-backend/verify-login-otp] Proxying to backend:', backendBase);

    // Forward real client IP headers so the backend sees the actual user IP
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    const response = await fetch(`${backendBase}/api/auth/verify-login-otp`, {
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
    console.log('[auth-backend/verify-login-otp] Backend response status:', response.status, 'success:', data.success);

    // Create response with the same status
    const nextResponse = NextResponse.json(data, { status: response.status });

    // If verification was successful, forward ALL Set-Cookie headers from backend.
    // The backend sets: sessionId, session_id, neural_link_session (JWT), neural_token
    // ALL must reach the browser for cross-backend auth to work.
    if (response.ok && data.success && data.user) {
      const setCookies: string[] = (response.headers as any).getSetCookie?.() || [];
      
      if (setCookies.length > 0) {
        for (const cookie of setCookies) {
          nextResponse.headers.append('Set-Cookie', cookie);
        }
        console.log('[auth-backend/verify-login-otp] Forwarded', setCookies.length, 'Set-Cookie headers from backend');
      } else {
        const rawSetCookie = response.headers.get('set-cookie');
        if (rawSetCookie) {
          const cookies = rawSetCookie.split(/,\s*(?=[a-zA-Z_]+=)/);
          for (const cookie of cookies) {
            nextResponse.headers.append('Set-Cookie', cookie.trim());
          }
          console.log('[auth-backend/verify-login-otp] Forwarded', cookies.length, 'cookies from raw header');
        } else {
          console.log('[auth-backend/verify-login-otp] No Set-Cookie header from backend');
        }
      }
      // NOTE: Do NOT clear hostname-scoped cookies here - backend handles it properly
      // Clearing here would create duplicate empty cookies that break session resolution
    }

    return nextResponse;
  } catch (error) {
    console.error('Error proxying /api/auth-backend/verify-login-otp:', error);
    return NextResponse.json(
      { success: false, message: 'Email OTP verification failed - server error' },
      { status: 500 }
    );
  }
}
