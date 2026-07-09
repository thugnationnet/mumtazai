import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3005';

/**
 * GET /api/auth/yahoo — Proxy to backend, which redirects to Yahoo OAuth consent page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '';

  const backendUrl = `${BACKEND_URL}/api/auth/yahoo${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;

  return NextResponse.redirect(backendUrl);
}
