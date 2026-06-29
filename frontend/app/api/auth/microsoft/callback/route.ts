import { BACKEND_URL } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  const { search } = new URL(request.url);

  return NextResponse.redirect(`${BACKEND_URL}/auth/microsoft/callback${search}`, { status: 302 });
}
