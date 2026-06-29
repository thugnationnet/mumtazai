import { BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/canvas/exec
 * Proxy terminal command execution to the backend sandbox.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/canvas/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Canvas Exec API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        stdout: '',
        stderr: 'Backend unavailable — could not execute command',
        exitCode: 1,
      },
      { status: 502 }
    );
  }
}
