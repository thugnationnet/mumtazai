import { BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '';
  const qs = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';

  return NextResponse.redirect(`${BACKEND_URL}/api/auth/microsoft${qs}`, { status: 302 });
}
