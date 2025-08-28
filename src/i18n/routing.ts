// src/i18n/routing.ts
// Routing configuration for reference only
export const locales = ['en', 'fr', 'it'] as const;
export const defaultLocale = 'en' as const;

export const pathnames = {
  '/': '/',
  '/dashboard': '/dashboard',
  '/admin': '/admin',
  '/admin/vacation-requests': '/admin/vacation-requests',
  '/admin/analytics': '/admin/analytics'
} as const;

// Helper function for backward compatibility
export function createLocaleUrl(path: string, currentLocale: string) {
  if (!locales.includes(path.split('/')[1] as typeof locales[number])) {
    return `/${currentLocale}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}
