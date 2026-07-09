import { NextRequest, NextResponse } from 'next/server';
import {
  verifyRequest,
  unauthorizedResponse,
} from '../../../../../lib/validateAuth';

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'https://onelastai.co:3005';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Require authentication
    const authResult = verifyRequest(request);
    if (!authResult.ok) return unauthorizedResponse(authResult.error);

    // Proxy to backend
    const { userId } = params;
    const backendUrl = `${BACKEND_BASE}/api/user/profile/${userId}`;

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: Object.fromEntries(request.headers),
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: res.headers as any,
    });
  } catch (err: any) {
    console.error('[/api/user/profile/[userId]] Proxy error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Proxy error' },
      { status: 500 }
    );
  }
}
