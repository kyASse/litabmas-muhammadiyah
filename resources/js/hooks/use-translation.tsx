import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dictionaries, SupportedLocale, TranslationType } from '@/lang';

export interface TranslationContextType {
  locale: SupportedLocale;
  setLocale: (newLocale: SupportedLocale) => void;
  toggleLocale: () => void;
  t: TranslationType;
  format: (template: string, replacements: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  // Synchronize locale to state, localStorage, cookie, and html lang
  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_locale', newLocale);
      setCookie('app_locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'id' : 'en');
  }, [locale, setLocale]);

  // Load initial locale from localStorage, fallback to 'en'
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('app_locale') as SupportedLocale | null;
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'id')) {
        setLocale(savedLocale);
      } else {
        setLocale('en');
      }
    }
  }, [setLocale]);

  const format = useCallback((template: string, replacements: Record<string, string | number>): string => {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return result;
  }, []);

  const t = dictionaries[locale] || dictionaries.en;

  return (
    <TranslationContext.Provider value={{ locale, setLocale, toggleLocale, t, format }}>
      {children}
    </TranslationContext.Provider>
  );
};

export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext);
  if (!context) {
    // Graceful fallback if invoked outside TranslationProvider (e.g. isolated test or preview)
    const defaultLocale: SupportedLocale = 'en';
    return {
      locale: defaultLocale,
      setLocale: () => {},
      toggleLocale: () => {},
      t: dictionaries[defaultLocale],
      format: (template, replacements) => {
        let res = template;
        for (const [k, v] of Object.entries(replacements)) {
          res = res.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
        return res;
      },
    };
  }
  return context;
}
