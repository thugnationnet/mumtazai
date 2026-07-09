import { NextRequest, NextResponse } from 'next/server';

// Use chat backend for subscription routes (port 3008 in production)
const BACKEND_URL = process.env.CHAT_BACKEND_URL || process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3005';

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
