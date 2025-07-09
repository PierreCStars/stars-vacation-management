'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/i18n';
import { useState } from 'react';

export default function LanguageSelector() {
  const { language, setLanguage, getLanguageName, getLanguageFlag } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: Language[] = ['en', 'fr', 'it'];

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  // Fallback values in case translations are not loaded yet
  const currentLanguageName = getLanguageName ? getLanguageName(language) : 'English';
  const currentLanguageFlag = getLanguageFlag ? getLanguageFlag(language) : '🇺🇸';

  return (
    <div className="relative">
      {/* Current Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 text-white"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>{currentLanguageFlag}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
          {currentLanguageName}
        </span>
        <svg
          style={{
            width: '0.75rem',
            height: '0.75rem',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.5rem',
            width: '12rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            zIndex: 50
          }}
        >
          <div className="py-1" style={{ padding: '0.25rem 0' }}>
            {languages.map((lang) => {
              const langName = getLanguageName ? getLanguageName(lang) : lang.toUpperCase();
              const langFlag = getLanguageFlag ? getLanguageFlag(lang) : '🏳️';
              
              return (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-3 ${
                    language === lang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    transition: 'background-color 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    backgroundColor: language === lang ? '#eff6ff' : 'transparent',
                    color: language === lang ? '#1d4ed8' : '#374151'
                  }}
                  onMouseEnter={(e) => {
                    if (language !== lang) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (language !== lang) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{langFlag}</span>
                  <span style={{ fontWeight: language === lang ? '600' : '400' }}>
                    {langName}
                  </span>
                  {language === lang && (
                    <svg
                      style={{ width: '1rem', height: '1rem', marginLeft: 'auto' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 