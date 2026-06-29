import { CHAT_BACKEND_URL as BACKEND_BASE } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyRequest,
  unauthorizedResponse,
} from '../../../../lib/validateAuth';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, agentId } = body;

    if (!userId || !agentId) {
      return NextResponse.json(
        { success: false, error: 'userId and agentId are required' },
        { status: 400 }
      );
    }

    // Require authentication
    const authResult = verifyRequest(request);
    if (!authResult.ok) return unauthorizedResponse(authResult.error);

    // Proxy to backend - only forward safe headers
    const backendUrl = `${BACKEND_BASE}/api/agent/subscriptions/check/${userId}/${agentId}`;

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      cache: 'no-store',
    });

    const data = await res.json();
    
    // Normalize the response - backend uses hasActiveSubscription, frontend expects hasAccess
    const normalizedData = {
      ...data,
      hasAccess: data.hasAccess || data.hasActiveSubscription || false,
      subscription: data.subscription || null,
    };
    
    return NextResponse.json(normalizedData, { status: res.status });
  } catch (err: any) {
    console.error('[/api/subscriptions/check] Proxy error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Proxy error' },
      { status: 500 }
    );
  }
}
