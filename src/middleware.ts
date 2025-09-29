import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set<string>([
  "/login",
  "/api/auth",   // NextAuth endpoints
  "/api/health", // optional health
  "/favicon.ico",
  "/stars-logo.png",
  "/favicon-32.png",
  "/favicon-16.png",
  "/favicon-48.png",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Log all requests in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 ${req.method} ${pathname}`, {
      userAgent: req.headers.get('user-agent'),
      referer: req.headers.get('referer'),
      timestamp: new Date().toISOString()
    });
  }

  // Allow NextAuth and static/public files
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/public/") ||
    PUBLIC_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  // If no session cookie, send to /login
  const hasSession =
    req.cookies.has("next-auth.session-token") || // production cookie name (Node)
    req.cookies.has("__Secure-next-auth.session-token"); // secure cookie on HTTPS

  if (!hasSession && pathname !== "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Add error tracking headers
  const response = NextResponse.next();
  
  // Add custom headers for debugging
  response.headers.set('X-Debug-Timestamp', new Date().toISOString());
  response.headers.set('X-Debug-Request-ID', Math.random().toString(36).substring(2, 15));

  return response;
}

export const config = {
  matcher: [
    // Protect everything by default, except public files handled above
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ],
};
