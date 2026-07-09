import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const SUBDOMAIN_SECRET = process.env.SUBDOMAIN_TOKEN_SECRET || process.env.JWT_SECRET || 'subdomain-secret-key';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

/**
 * SSO Redirect Endpoint
 * Called by subdomain apps (e.g., maula.onelastai.co) to authenticate users
 * If user is logged in on main site, generates a token and redirects back
 * If not logged in, redirects to login page with return URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('return_url');
    
    if (!returnUrl) {
      return NextResponse.json(
        { success: false, error: 'return_url is required' },
        { status: 400 }
      );
    }

    // Validate return URL (only allow known subdomains)
    const allowedOrigins = [
      'https://maula.onelastai.co',
      'http://localhost:5173',
      'http://localhost:3200',
    ];
    
    const decodedUrl = decodeURIComponent(returnUrl);
    if (!allowedOrigins.some(origin => decodedUrl.startsWith(origin))) {
      return NextResponse.json(
        { success: false, error: 'Invalid return URL' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    const sessionToken = cookieStore.get('session_token')?.value;
    const sessionId = cookieStore.get('session_id')?.value || cookieStore.get('sessionId')?.value;
    
    if (!authToken && !sessionToken && !sessionId) {
      // Not logged in - redirect to login with return URL
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', `/api/auth/subdomain-redirect?return_url=${encodeURIComponent(returnUrl)}`);
      return NextResponse.redirect(loginUrl);
    }

    // Verify the user is authenticated with the backend
    const cookieHeader = cookieStore.getAll()
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    const verifyResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        'Cookie': cookieHeader,
      },
    });

    if (!verifyResponse.ok) {
      // Session invalid - redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', `/api/auth/subdomain-redirect?return_url=${encodeURIComponent(returnUrl)}`);
      return NextResponse.redirect(loginUrl);
    }

    const userData = await verifyResponse.json();
    const user = userData.user || userData.data?.user;

    if (!user || !user.id) {
      // User not found - redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', `/api/auth/subdomain-redirect?return_url=${encodeURIComponent(returnUrl)}`);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated - generate SSO token
    const secret = new TextEncoder().encode(SUBDOMAIN_SECRET);
    
    const token = await new jose.SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      type: 'sso_handoff',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m') // Short-lived token
      .setIssuer('onelastai.co')
      .setAudience('maula.onelastai.co')
      .sign(secret);

    // Redirect back to subdomain with token
    const redirectUrl = new URL(decodedUrl);
    redirectUrl.pathname = '/auth/callback';
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('source', 'sso');
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('[SSO Redirect] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
