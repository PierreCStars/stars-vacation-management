// src/i18n/routing.ts
import {defineRouting, createLocalizedPathnamesNavigation} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'fr', 'it'],
  defaultLocale: 'en',
  pathnames: {
    '/': '/',
    '/dashboard': '/dashboard',
    '/admin': '/admin',
    '/admin/vacation-requests': '/admin/vacation-requests',
    '/admin/analytics': '/admin/analytics'
  }
});

export const { Link, redirect, usePathname, useRouter } =
  createLocalizedPathnamesNavigation(routing);

// Keep the helper function for backward compatibility
export function createLocaleUrl(path: string, currentLocale: string) {
  const locales = ['en', 'fr', 'it'] as const;
  if (!locales.includes(path.split('/')[1] as typeof locales[number])) {
    return `/${currentLocale}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}
