import { CHAT_BACKEND_URL as INTERNAL_BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';


/**
 * Cancel Subscription API Route
 * Immediately cancels user's agent subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, agentId, subscriptionId, immediate } = body;

    // Validate required fields
    if (!userId || !agentId) {
      return NextResponse.json(
        { success: false, error: 'userId and agentId are required' },
        { status: 400 }
      );
    }

    // Forward cookies for authentication
    const cookieHeader = request.headers.get('cookie') || '';

    // Call backend cancel endpoint
    const backendUrl = `${INTERNAL_BACKEND_URL}/api/agent/subscriptions/cancel`;

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ userId, agentId, immediate: immediate ?? true }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || 'Failed to cancel subscription',
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Subscription cancelled successfully',
      subscription: data.subscription,
    });
  } catch (err: any) {
    console.error('[/api/subscriptions/cancel] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
