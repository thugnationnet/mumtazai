/**
 * POST /api/push/unsubscribe
 * Removes a push subscription from the backend
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BACKEND_URL } from '@/lib/backend-url';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, message: 'Missing subscription endpoint' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('neural_link_session')?.value || '';

    const response = await fetch(`${BACKEND_URL}/api/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `neural_link_session=${sessionCookie}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Unsubscribe failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Push subscription removed' });
  } catch (error: unknown) {
    console.error('[push/unsubscribe] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
