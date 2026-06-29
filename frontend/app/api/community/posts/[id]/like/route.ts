import { NextRequest, NextResponse } from 'next/server';

// =====================================================
// POST /api/community/posts/[id]/like - Proxy to backend
// =====================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/community/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Like post proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to like post' },
      { status: 500 }
    );
  }
}
