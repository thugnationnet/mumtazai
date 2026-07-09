import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '';
  const qs = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';

  return NextResponse.redirect(`${BACKEND_URL}/auth/microsoft${qs}`, { status: 302 });
}
