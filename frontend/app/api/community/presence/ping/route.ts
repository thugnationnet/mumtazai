import { NextRequest, NextResponse } from 'next/server';

// =====================================================
// POST /api/community/presence/ping - Proxy to backend
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const body = await request.json();

    const response = await fetch(`${backendUrl}/api/community/presence/ping`, {
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
    console.error('❌ Presence ping proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}
