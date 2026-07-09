import { NextRequest, NextResponse } from 'next/server';

// Stub endpoint — returns empty usage array until billing backend is integrated.
// Prevents dashboard from receiving 404s on /api/billing/usage.
export async function GET(_req: NextRequest) {
  return NextResponse.json({ usage: [], total: 0 });
}
