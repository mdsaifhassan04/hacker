import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './en.json';
import hi from './hi.json';

export type SupportedLanguage = 'en' | 'hi';

type TranslationDictionary = typeof en;

const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  hi,
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (keyPath: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'medikiosk_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    sessionStorage.setItem(SESSION_STORAGE_KEY, lang);
  };

  useEffect(() => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, language);
  }, [language]);

  // Helper function to resolve nested keys like "welcome.title"
  const t = (keyPath: string, fallback?: string): string => {
    const keys = keyPath.split('.');
    let current: unknown = translations[language] || translations.en;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        // Fallback to English if missing in current language
        let enCurrent: unknown = translations.en;
        for (const enKey of keys) {
          if (enCurrent && typeof enCurrent === 'object' && enKey in (enCurrent as Record<string, unknown>)) {
            enCurrent = (enCurrent as Record<string, unknown>)[enKey];
          } else {
            return fallback || keyPath;
          }
        }
        return typeof enCurrent === 'string' ? enCurrent : (fallback || keyPath);
      }
    }

    return typeof current === 'string' ? current : (fallback || keyPath);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
