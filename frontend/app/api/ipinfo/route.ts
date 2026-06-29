import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED — IP info is now served by tools-backend POST /api/tools/ip-info
 * This route is kept only as a redirect for any remaining callers.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get('ip') || '';

  const backendUrl = process.env.TOOLS_BACKEND_URL || 'http://127.0.0.1:3010';
  try {
    const response = await fetch(`${backendUrl}/api/tools/ip-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip }),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'IP lookup service unavailable' },
      { status: 502 }
    );
  }
}
