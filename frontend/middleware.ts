import { NextRequest, NextResponse } from 'next/server';

// Maps the first DNS label of *.mumtaz.ai to the Next.js route
// that should be shown when the user visits the subdomain root.
const SUBDOMAIN_ROUTES: Record<string, string> = {
  // demo, studio, build, canvas, editor have dedicated frontend apps
  // served directly by Nginx — no Next.js redirect needed for those
  'ai-demo':               '/neural-chat',
  chat:                    '/neural-chat',
  // App sections
  tools:                   '/tools',
  community:               '/community',
  support:                 '/support',
  lab:                     '/lab',
  // Agents
  'comedy-king':           '/agents/comedy-king',
  'ben-sega':              '/agents/ben-sega',
  'bishop-burger':         '/agents/bishop-burger',
  'chef-biew':             '/agents/chef-biew',
  'chess-player':          '/agents/chess-player',
  'drama-queen':           '/agents/drama-queen',
  einstein:                '/agents/einstein',
  'emma-emotional':        '/agents/emma-emotional',
  'fitness-guru':          '/agents/fitness-guru',
  'julie-girlfriend':      '/agents/julie-girlfriend',
  'knight-logic':          '/agents/knight-logic',
  'lazy-pawn':             '/agents/lazy-pawn',
  'mrs-boss':              '/agents/mrs-boss',
  'nid-gaming':            '/agents/nid-gaming',
  'professor-astrology':   '/agents/professor-astrology',
  'rook-jokey':            '/agents/rook-jokey',
  'tech-wizard':           '/agents/tech-wizard',
  'travel-buddy':          '/agents/travel-buddy',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept the bare root path — all other paths render normally
  if (pathname !== '/') return NextResponse.next();

  const host = request.headers.get('host') || request.nextUrl.hostname;
  // Extract the first label: "comedy-king.mumtaz.ai" → "comedy-king"
  const subdomain = host.split('.')[0];

  const route = SUBDOMAIN_ROUTES[subdomain];
  if (route) {
    // Rewrite (not redirect) so the URL stays clean at the subdomain root
    return NextResponse.rewrite(new URL(route, request.url));
  }

  // Main domain (mumtaz.ai, www.mumtaz.ai) — redirect to homepage
  return NextResponse.redirect(new URL('/home', request.url));
}

export const config = {
  matcher: ['/'],
};
