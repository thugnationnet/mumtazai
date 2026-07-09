import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path?.join('/') || '';
    const url = new URL(request.url);
    const queryString = url.search;
    
    const response = await fetch(`${BACKEND_URL}/api/gamification/${path}${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Backend responded with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Gamification API proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path?.join('/') || '';
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/gamification/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Backend responded with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Gamification API proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}