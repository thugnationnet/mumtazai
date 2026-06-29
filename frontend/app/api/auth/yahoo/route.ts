import { BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';


/**
 * GET /api/auth/yahoo — Proxy to backend, which redirects to Yahoo OAuth consent page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '';

  const backendUrl = `${BACKEND_URL}/api/auth/yahoo${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;

  return NextResponse.redirect(backendUrl);
}
