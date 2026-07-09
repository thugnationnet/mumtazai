/**
 * Newsletter API Route
 * Proxies newsletter subscription requests to the backend
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, source = 'newsletter' } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Get metadata to forward to backend
    const forwardedFor = request.headers.get('x-forwarded-for');
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');

    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(forwardedFor && { 'x-forwarded-for': forwardedFor }),
        ...(userAgent && { 'user-agent': userAgent }),
        ...(referer && { 'referer': referer }),
      },
      body: JSON.stringify({ email, name, source }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
