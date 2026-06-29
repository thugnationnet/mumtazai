import { AUTH_BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const backendBase = AUTH_BACKEND_URL;
    const body = await request.json();

    console.log('[auth-backend/resend-login-otp] Proxying to backend:', backendBase);

    // Forward real client IP headers so the backend sees the actual user IP
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    const response = await fetch(`${backendBase}/api/auth/resend-login-otp`, {
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
    console.log('[auth-backend/resend-login-otp] Backend response status:', response.status, 'success:', data.success);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying /api/auth-backend/resend-login-otp:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to resend OTP - server error' },
      { status: 500 }
    );
  }
}
