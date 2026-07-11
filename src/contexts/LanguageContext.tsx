import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, LanguageCode, TranslationKey } from '../i18n';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem('civicpulse_language') as LanguageCode;
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('civicpulse_language', lang);
    }
  };

  const t = (key: TranslationKey): string => {
    // Fallback to English if translation is missing in the current language
    const currentTranslations = translations[language];
    const enTranslations = translations.en;
    
    if (currentTranslations && currentTranslations[key]) {
      return currentTranslations[key] as string;
    }
    
    if (enTranslations && enTranslations[key]) {
      return enTranslations[key] as string;
    }
    
    // Return key as last resort so developer can see what's missing
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
