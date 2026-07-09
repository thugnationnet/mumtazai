/**
 * Get User Agent Subscriptions API
 * Returns all agent subscriptions for a specific user
 */

import { NextRequest, NextResponse } from 'next/server';

// Use chat backend for subscription routes (port 3008 in production)
const BACKEND_URL = process.env.CHAT_BACKEND_URL || process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3005';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/agent/subscriptions/user/${userId}`,
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
    console.error('Error fetching user subscriptions:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch subscriptions',
        subscriptions: [],
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
