'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslations, getLanguageName, getLanguageFlag } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: ReturnType<typeof getTranslations>;
  getLanguageName: (language: Language) => string;
  getLanguageFlag: (language: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Default context value to prevent undefined errors
const defaultContextValue: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: getTranslations('en'),
  getLanguageName,
  getLanguageFlag,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Only try to access localStorage on the client side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedLanguage = window.localStorage.getItem('language') as Language;
        if (savedLanguage && ['en', 'fr', 'it'].includes(savedLanguage)) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.warn('Failed to load language from localStorage:', error);
      }
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    
    // Only try to save to localStorage on the client side
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('language', newLanguage);
      } catch (error) {
        console.warn('Failed to save language to localStorage:', error);
      }
    }
  };

  // Always provide a valid context value, even during SSR
  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t: getTranslations(language),
    getLanguageName,
    getLanguageFlag,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Updated useLanguage hook that returns default context instead of throwing errors
// This fix ensures Google Calendar works without language dependencies
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return a default context instead of throwing an error
    return {
      language: 'en',
      setLanguage: () => {},
      t: getTranslations('en'),
      getLanguageName,
      getLanguageFlag,
    };
  }
  return context;
} 