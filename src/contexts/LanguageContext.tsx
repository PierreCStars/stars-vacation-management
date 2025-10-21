'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Define the translation structure
interface Translations {
  common: Record<string, string>;
  nav: Record<string, string>;
  vacations: Record<string, string>;
  analytics?: Record<string, string>;
  emails?: Record<string, any>; // Allow nested objects for email templates
  calendar?: Record<string, string>;
  admin?: Record<string, any>; // Allow nested objects for admin section
  dashboard?: Record<string, string>;
}

// Create the context
const LanguageContext = createContext<{
  t: (key: string) => string;
  tNav: (key: string) => string;
  tVacations: (key: string) => string;
  tAnalytics: (key: string) => string;
  tEmails: (key: string) => string;
  tCalendar: (key: string) => string;
  tAdmin: (key: string) => string;
  tDashboard: (key: string) => string;
  currentLocale: string;
}>({
  t: () => '',
  tNav: () => '',
  tVacations: () => '',
  tAnalytics: () => '',
  tEmails: () => '',
  tCalendar: () => '',
  tAdmin: () => '',
  tDashboard: () => '',
  currentLocale: 'en'
});

// Hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// Provider component
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentLocale, setCurrentLocale] = useState('en');
  const [translations, setTranslations] = useState<Translations | null>(null);

  useEffect(() => {
    const locale = pathname?.split('/')[1] || 'en';
    setCurrentLocale(locale);
    
    // Load translations for the current locale
    const loadTranslations = async () => {
      try {
        const { messages } = await import('@/locales');
        const localeMessages = messages[locale as keyof typeof messages];
        setTranslations(localeMessages);
      } catch (error) {
        console.warn(`Failed to load translations for locale ${locale}:`, error);
        // Fallback to English
        try {
          const { messages } = await import('@/locales');
          setTranslations(messages.en);
        } catch (fallbackError) {
          console.error('Failed to load fallback translations:', fallbackError);
          setTranslations(null);
        }
      }
    };

    loadTranslations();
  }, [pathname]);

  // Translation functions
  const t = (key: string) => {
    if (!translations) return key;
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    return value || key;
  };

  const tNav = (key: string) => {
    if (!translations?.nav) return key;
    return translations.nav[key] || key;
  };

  const tVacations = (key: string) => {
    if (!translations?.vacations) return key;
    return translations.vacations[key] || key;
  };

  const tAnalytics = (key: string) => {
    if (!translations?.analytics) return key;
    return translations.analytics[key] || key;
  };

  const tEmails = (key: string) => {
    if (!translations?.emails) return key;
    return translations.emails[key] || key;
  };

  const tCalendar = (key: string) => {
    if (!translations?.calendar) return key;
    return translations.calendar[key] || key;
  };

  const tAdmin = (key: string) => {
    if (!translations?.admin) return key;
    return translations.admin[key] || key;
  };

  const tDashboard = (key: string) => {
    if (!translations?.dashboard) return key;
    return translations.dashboard[key] || key;
  };

  return (
    <LanguageContext.Provider value={{
      t,
      tNav,
      tVacations,
      tAnalytics,
      tEmails,
      tCalendar,
      tAdmin,
      tDashboard,
      currentLocale
    }}>
      {children}
    </LanguageContext.Provider>
  );
} 