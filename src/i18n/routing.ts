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
  
  // Simply prepend the locale to the path
  // The components should handle removing existing locales before calling this
  return `/${currentLocale}${normalizedPath}`;
}
