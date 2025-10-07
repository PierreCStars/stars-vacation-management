import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Already localized
  if (pathname === '/en' || pathname.startsWith('/en/')) return NextResponse.next();
  if (pathname === '/fr' || pathname.startsWith('/fr/')) return NextResponse.next();

  // Redirect root to /en
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/en';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)']
};
