import { CHAT_BACKEND_URL as BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; agentId: string }> }
) {
  try {
    const { userId, agentId } = await params;

    if (!userId || !agentId) {
      return NextResponse.json(
        { error: 'User ID and Agent ID are required' },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/agent/subscriptions/check/${userId}/${agentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        cache: 'no-store',
      }
    );

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to check subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
