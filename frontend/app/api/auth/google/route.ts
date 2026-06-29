import { BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';


/**
 * GET /api/auth/google — Proxy to backend, which redirects to Google OAuth consent page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '';

  const backendUrl = `${BACKEND_URL}/api/auth/google${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;

  // For OAuth initiate, we redirect the browser to the backend, which then redirects to Google
  return NextResponse.redirect(backendUrl);
}
