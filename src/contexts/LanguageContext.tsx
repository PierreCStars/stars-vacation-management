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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      setIsClient(true);
      // Load language from localStorage on mount (only on client side)
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedLanguage = localStorage.getItem('stars-vacation-language') as Language;
        if (savedLanguage && ['en', 'fr', 'it'].includes(savedLanguage)) {
          setLanguageState(savedLanguage);
        }
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing LanguageProvider:', error);
      // Fallback to default language
      setLanguageState('en');
      setIsInitialized(true);
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    try {
      setLanguageState(newLanguage);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('stars-vacation-language', newLanguage);
      }
    } catch (error) {
      console.error('Error setting language:', error);
      // Continue with the state change even if localStorage fails
      setLanguageState(newLanguage);
    }
  };

  // Always provide a valid context value, even during initialization
  const value: LanguageContextType = {
    language,
    setLanguage,
    t: getTranslations(language),
    getLanguageName,
    getLanguageFlag,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return default context instead of throwing error
    console.warn('useLanguage must be used within a LanguageProvider, using default context');
    return defaultContextValue;
  }
  return context;
} 