import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3005';

/**
 * Proxy canvas generation to backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/canvas/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying canvas generation to backend:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate canvas' },
      { status: 500 }
    );
  }
}
