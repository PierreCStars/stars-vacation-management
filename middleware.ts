import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en','fr','it'],
  defaultLocale: 'en'
});

export const config = {
  matcher: ['/', '/(en|fr|it)/:path*']
};
