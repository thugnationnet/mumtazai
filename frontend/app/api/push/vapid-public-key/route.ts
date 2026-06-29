/**
 * GET /api/push/vapid-public-key
 * Returns the VAPID public key for the client to subscribe to push notifications
 */
import { NextResponse } from 'next/server';

export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';

  if (!vapidPublicKey) {
    return NextResponse.json(
      { success: false, message: 'Push notifications not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    publicKey: vapidPublicKey,
  });
}
