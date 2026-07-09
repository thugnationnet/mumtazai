import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';

    // Get session cookie to forward to backend
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { message: 'No session ID' },
        { status: 401 }
      );
    }

    // Proxy to backend export endpoint
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/user/conversations/${userId}/export?format=${format}`,
      {
        method: 'GET',
        headers: {
          Cookie: `session_id=${sessionId}`,
        },
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    // Get content type from backend
    const contentType = backendResponse.headers.get('content-type') || 'application/json';
    const contentDisposition = backendResponse.headers.get('content-disposition');

    // Stream the response
    const data = await backendResponse.arrayBuffer();
    
    const response = new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
      },
    });

    if (contentDisposition) {
      response.headers.set('Content-Disposition', contentDisposition);
    }

    return response;
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
