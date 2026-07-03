import { NextResponse } from 'next/server';

// Stub: Demo has no user preferences persistence
export async function GET() {
  return NextResponse.json({ success: true, data: {} });
}

export async function PUT() {
  return NextResponse.json({ success: true });
}

export async function POST() {
  return NextResponse.json({ success: true });
}
