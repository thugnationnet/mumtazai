import { NextResponse } from 'next/server';

// Stub: Demo has no memory persistence
export async function GET() {
  return NextResponse.json({
    success: true,
    data: { enabled: false, userName: '', language: '', gender: '', dateOfBirth: '', memories: [] },
  });
}

export async function PUT() {
  return NextResponse.json({ success: true, message: 'Memory not available in demo' });
}
