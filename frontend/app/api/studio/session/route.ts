import { NextRequest, NextResponse } from 'next/server';

// Use internal backend URL for server-to-server communication
const BACKEND_URL = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3005';

export async function GET(request: NextRequest) {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/studio/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Studio session GET proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get studio session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/studio/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Studio session POST proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save studio session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/studio/session`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Studio session DELETE proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear studio session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
