import { NextRequest, NextResponse } from 'next/server';

// =====================================================
// GET /api/community/posts - Proxy to backend
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const url = new URL(request.url);

    // Forward query parameters
    const searchParams = url.searchParams;
    const backendUrlWithParams = `${backendUrl}/api/community/posts${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

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
    console.error('❌ Community posts proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/community/posts - Proxy to backend
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const body = await request.json();

    const response = await fetch(`${backendUrl}/api/community/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Community posts proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
