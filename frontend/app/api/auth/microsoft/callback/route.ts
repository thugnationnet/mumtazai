import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  const { search } = new URL(request.url);

  return NextResponse.redirect(`${BACKEND_URL}/auth/microsoft/callback${search}`, { status: 302 });
}
