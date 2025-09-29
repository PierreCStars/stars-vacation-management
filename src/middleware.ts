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
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};