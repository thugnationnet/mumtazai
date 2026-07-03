import { NextResponse } from 'next/server';

// Stub: Web search not available in demo
export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Web search is not available in the demo. Sign up for full access at onelastai.co',
  });
}
