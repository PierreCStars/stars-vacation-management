// src/i18n/routing.ts
import { useRouter as useNextRouter, usePathname as useNextPathname } from 'next/navigation';

// List all locales we support and the default
export const locales = ['en', 'fr', 'it'] as const;
export const defaultLocale = 'en' as const;

// Custom hook for locale-aware routing
export function useRouter() {
  const router = useNextRouter();
  const pathname = useNextPathname();
  
  return {
    push: (url: string) => {
      // Extract locale from current pathname
      const currentLocale = pathname.split('/')[1] || 'en';
      
      // If URL doesn't start with locale, add it
      if (!locales.includes(url.split('/')[1] as typeof locales[number])) {
        url = `/${currentLocale}${url.startsWith('/') ? url : `/${url}`}`;
      }
      
      router.push(url);
    },
    replace: (url: string) => {
      // Extract locale from current pathname
      const currentLocale = pathname.split('/')[1] || 'en';
      
      // If URL doesn't start with locale, add it
      if (!locales.includes(url.split('/')[1] as typeof locales[number])) {
        url = `/${currentLocale}${url.startsWith('/') ? url : `/${url}`}`;
      }
      
      router.replace(url);
    }
  };
}

export function usePathname() {
  return useNextPathname();
}

export function redirect(url: string) {
  // This is a client-side redirect - for server-side use Next.js redirect
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}

// Helper function to create locale-aware URLs
export function createLocaleUrl(path: string, currentLocale: string) {
  if (!locales.includes(path.split('/')[1] as typeof locales[number])) {
    return `/${currentLocale}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}
