import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3005';

/**
 * GET /api/auth/github — Proxy to backend, which redirects to GitHub OAuth authorization page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '';

  const backendUrl = `${BACKEND_URL}/api/auth/github${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;

  return NextResponse.redirect(backendUrl);
}
