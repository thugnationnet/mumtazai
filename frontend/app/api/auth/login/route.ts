import { BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';

// Use internal backend URL for server-to-server communication

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

    // Forward cookies from backend response
    const response = NextResponse.json(data, { status: backendResponse.status });

    // Copy set-cookie headers from backend
    const setCookieHeaders = backendResponse.headers.get('set-cookie');
    if (setCookieHeaders) {
      response.headers.set('set-cookie', setCookieHeaders);
    }

    return response;
  } catch (error) {
    console.error('Auth login proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process login request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
