import { NextResponse } from 'next/server';

// Stub: canvas-projects is disabled in the demo
export async function GET() {
  return NextResponse.json({ success: true, project: null });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    message: 'Canvas Builder is available in the full version. Sign up at onelastai.co',
  }, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    message: 'Canvas Builder is available in the full version. Sign up at onelastai.co',
  }, { status: 403 });
}
