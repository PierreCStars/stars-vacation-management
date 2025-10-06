import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'fr', 'it'];
const defaultLocale = 'en';

// Get the preferred locale, similar to the above or similar
function getLocale(request: NextRequest): string {
  // Check if there is any supported locale in the pathname
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocaleFromHeader(request) || defaultLocale;
    return locale;
  }

  // Extract locale from pathname
  const locale = pathname.split('/')[1];
  return locales.includes(locale) ? locale : defaultLocale;
}

function getLocaleFromHeader(request: NextRequest): string | undefined {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return undefined;

  const languages = acceptLanguage
    .split(',')
    .map((lang) => lang.split(';')[0].trim().toLowerCase());

  for (const lang of languages) {
    if (locales.includes(lang)) return lang;
    // Check for language without country code (e.g., 'fr' from 'fr-FR')
    const langWithoutCountry = lang.split('-')[0];
    if (locales.includes(langWithoutCountry)) return langWithoutCountry;
  }

  return undefined;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';

  // Domain redirect: stars-vacation-management.vercel.app -> starsvacationmanagementv2.vercel.app
  const CANONICAL_HOST = 'starsvacationmanagementv2.vercel.app';
  const OLD_HOST = 'stars-vacation-management.vercel.app';
  
  if (host === OLD_HOST) {
    console.log('[REDIRECT] Redirecting old domain to canonical:', { from: host, to: CANONICAL_HOST });
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = 'https';
    return NextResponse.redirect(url, 308); // Permanent redirect
  }

  // Skip middleware for static assets and auth routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/login') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webp')
  ) {
    return NextResponse.next();
  }

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocaleFromHeader(request) || defaultLocale;
    
    // Handle root path
    if (pathname === '/') {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
    
    // Handle other paths
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }

  // Check if the locale in the URL is valid
  const locale = pathname.split('/')[1];
  if (!locales.includes(locale)) {
    const validLocale = getLocaleFromHeader(request) || defaultLocale;
    return NextResponse.redirect(new URL(`/${validLocale}${pathname.substring(3)}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Matcher for all routes except API and static assets
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};