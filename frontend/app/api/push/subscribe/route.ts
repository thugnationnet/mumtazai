/**
 * POST /api/push/subscribe
 * Registers a push subscription with the backend
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BACKEND_URL } from '@/lib/backend-url';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, message: 'Invalid push subscription' },
        { status: 400 }
      );
    }

    // Forward auth cookie to backend
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('neural_link_session')?.value || '';

    const response = await fetch(`${BACKEND_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `neural_link_session=${sessionCookie}`,
      },
      body: JSON.stringify({ subscription }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Subscription failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Push subscription registered' });
  } catch (error: unknown) {
    console.error('[push/subscribe] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
