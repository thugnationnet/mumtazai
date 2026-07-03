import { NextResponse } from 'next/server';

// Stub: Image generation not available in demo
export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Image generation is not available in the demo. Sign up for full access at onelastai.co',
  });
}
