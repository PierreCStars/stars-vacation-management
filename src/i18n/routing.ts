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

// Helper function for creating locale-aware URLs
export function createLocaleUrl(path: string, currentLocale: string) {
  // Ensure the path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Check if the path already has a locale prefix
  const pathSegments = normalizedPath.split('/');
  const firstSegment = pathSegments[1];
  
  if (locales.includes(firstSegment as typeof locales[number])) {
    // Path already has a locale, replace it with the new locale
    return `/${currentLocale}${normalizedPath.substring(`/${firstSegment}`.length)}`;
  } else {
    // Path doesn't have a locale, add the current locale
    return `/${currentLocale}${normalizedPath}`;
  }
}
