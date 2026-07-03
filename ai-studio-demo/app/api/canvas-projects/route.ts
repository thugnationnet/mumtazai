import { NextResponse } from 'next/server';

// Stub: canvas-projects is disabled in the demo
export async function GET() {
  return NextResponse.json({ success: true, projects: [] });
}

export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Canvas Builder is available in the full version. Sign up at onelastai.co',
  }, { status: 403 });
}
