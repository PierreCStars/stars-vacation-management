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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      setIsClient(true);
      // Load language from localStorage on mount (only on client side)
      if (typeof window !== 'undefined') {
        const savedLanguage = localStorage.getItem('stars-vacation-language') as Language;
        if (savedLanguage && ['en', 'fr', 'it'].includes(savedLanguage)) {
          setLanguageState(savedLanguage);
        }
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing LanguageProvider:', error);
      setIsInitialized(true);
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    try {
      setLanguageState(newLanguage);
      if (typeof window !== 'undefined') {
        localStorage.setItem('stars-vacation-language', newLanguage);
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  // Don't render children until initialized to prevent context errors
  if (!isInitialized) {
    return (
      <LanguageContext.Provider value={{
        language: 'en',
        setLanguage: () => {},
        t: getTranslations('en'),
        getLanguageName,
        getLanguageFlag,
      }}>
        {children}
      </LanguageContext.Provider>
    );
  }

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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 