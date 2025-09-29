'use client';

import { usePathname } from 'next/navigation';
import { createLocaleUrl } from '@/i18n/routing';

export function LanguageSwitcher() {
  const pathname = usePathname();
  const currentLocale = pathname?.split('/')[1] || 'en';

  const handleLanguageChange = (newLocale: string) => {
    // Get the current path without the locale prefix
    // Split by '/' and remove the first two elements (empty string and locale)
    const pathSegments = pathname?.split('/') || [];
    const pathWithoutLocale = '/' + pathSegments.slice(2).join('/') || '/dashboard';
    
    // Create the new URL with the selected locale
    const newPath = createLocaleUrl(pathWithoutLocale, newLocale);
    
    // Use window.location for navigation to ensure proper locale change
    window.location.href = newPath;
  };

  return (
    <select
      value={pathname?.split('/')[1] || 'en'} // Assuming locale is the second segment
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
      aria-label="Language"
    >
      <option value="en">EN</option>
      <option value="fr">FR</option>
      <option value="it">IT</option>
    </select>
  );
}
