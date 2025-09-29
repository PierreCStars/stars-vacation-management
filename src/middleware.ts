// middleware.ts (root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set<string>([
  '/login',
  '/favicon.ico',
  '/stars-logo.png',
  '/favicon-16.png',
  '/favicon-32.png',
  '/favicon-48.png',
]);

// Build-time inline; safe for Edge
const IS_DEV = process.env.NODE_ENV === 'development';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dev-only lightweight log (Edge-safe)
  if (IS_DEV) {
    console.log('🌐', req.method, pathname, {
      ua: req.headers.get('user-agent'),
      t: new Date().toISOString(),
    });
  }

  // Always allow Next internals, images, and static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  // Allow NextAuth endpoints explicitly
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Skip ALL other API routes from auth middleware (avoid pulling server code into Edge)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Session cookie check
  const hasSession =
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token');

  if (!hasSession && pathname !== '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Add debug headers
  const res = NextResponse.next();
  res.headers.set('X-Debug-Timestamp', new Date().toISOString());
  res.headers.set('X-Debug-Request-ID', Math.random().toString(36).slice(2, 10));
  return res;
}

// Narrow matcher: protect pages, not Next internals or API (except /api/auth which we allow above)
export const config = {
  matcher: [
    // exclude: _next/*, static files, images, and ALL api routes
    '/((?!_next/|api/|images/|favicon.ico|.*\\.(png|jpg|jpeg|gif|svg|ico|txt|xml)).*)',
  ],
};