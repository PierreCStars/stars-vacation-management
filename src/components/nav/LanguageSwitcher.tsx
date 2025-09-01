'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function LanguageSwitcher() {
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    // Extract the path without locale prefix
    const pathWithoutLocale = pathname.replace(`/${newLocale}`, '');
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    
    // Use window.location for navigation to ensure proper locale change
    window.location.href = newPath;
  };

  return (
    <select
      value={pathname.split('/')[1]} // Assuming locale is the second segment
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
