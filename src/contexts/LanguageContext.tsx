import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'hi' | 'kn' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const currentLanguage = (['en', 'hi', 'kn', 'bn'].includes(i18n.language) 
    ? i18n.language 
    : 'en') as Language;

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && ['en', 'hi', 'kn', 'bn'].includes(saved) && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ language: currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
