import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COMMUNITY_BACKEND_URL = process.env.COMMUNITY_BACKEND_URL || 'http://localhost:3011';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const search = searchParams.get('search') || '';

    // Get session cookie to forward to backend
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { message: 'No session ID' },
        { status: 401 }
      );
    }

    // Build query params
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
    });

    // Proxy to community-backend (port 3011)
    const backendResponse = await fetch(
      `${COMMUNITY_BACKEND_URL}/api/user/conversations/${userId}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session_id=${sessionId}`,
        },
      }
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
