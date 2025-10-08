import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALES = ['en', 'fr'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next internals and assets
  if (
    pathname.startsWith('/_next') ||
    pathname.match(/^.*\.(?:ico|png|jpg|jpeg|svg|gif|webp|css|js|map|txt|xml)$/)
  ) {
    return NextResponse.next();
  }

  // Already localized?
  const isLocalized = LOCALES.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`));
  if (isLocalized) return NextResponse.next();

  // Redirect any non-localized path to default locale /en
  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)']
};
