import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering so we always hit the backend
export const dynamic = 'force-dynamic';

// This route is a thin proxy to the community-backend analytics endpoint
// at /api/user/analytics. In production, nginx routes directly to port 3011;
// this proxy is used in development mode only.
export async function GET(request: NextRequest) {
  try {
    const backendBase = process.env.COMMUNITY_BACKEND_URL || process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3011';

    const incomingUrl = new URL(request.url);
    const targetUrl = new URL('/api/user/analytics', backendBase);

    // Forward query string parameters (userId/email debugging, etc.)
    incomingUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        // Forward cookies so the backend can resolve the session
        cookie: request.headers.get('cookie') || '',
      },
      cache: 'no-store',
    });

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type':
          response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Error proxying /api/user/analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics data',
      },
      { status: 500 }
    );
  }
}
