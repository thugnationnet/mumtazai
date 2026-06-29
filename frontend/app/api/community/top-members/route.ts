import { NextRequest, NextResponse } from 'next/server';

// =====================================================
// GET /api/community/top-members - Proxy to backend
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const url = new URL(request.url);

    // Forward query parameters
    const searchParams = url.searchParams;
    const backendUrlWithParams = `${backendUrl}/api/community/top-members${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

    const response = await fetch(backendUrlWithParams, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Top members proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top members' },
      { status: 500 }
    );
  }
}
