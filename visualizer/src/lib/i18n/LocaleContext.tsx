'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import en from '@/locales/en.json';
import pt from '@/locales/pt.json';
import es from '@/locales/es.json';

export type Locale = 'en' | 'pt' | 'es';

const STORAGE_KEY = 'rlm-locale';

const translations: Record<Locale, Record<string, unknown>> = { en, pt, es };

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
  const primary = browserLang.split('-')[0].toLowerCase();

  if (primary === 'pt') return 'pt';
  if (primary === 'es') return 'es';
  return 'en';
}

function getSavedLocale(): Locale | null {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'pt' || saved === 'es') {
    return saved;
  }
  return null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = getSavedLocale();
    if (saved) {
      setLocaleState(saved);
    } else {
      const detected = detectBrowserLocale();
      setLocaleState(detected);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLocale);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[locale], key);

    if (!translation) {
      // Fallback to English
      const fallback = getNestedValue(translations.en, key);
      if (!fallback) {
        console.warn(`Missing translation: ${key}`);
        return key;
      }
      return interpolate(fallback, params);
    }

    return interpolate(translation, params);
  }, [locale]);

  // Prevent hydration mismatch by rendering children only after mount
  // But we still provide the context so components can access t()
  const value = { locale, setLocale, t };

  if (!mounted) {
    // During SSR and initial hydration, use English
    return (
      <LocaleContext.Provider value={{ locale: 'en', setLocale, t: (key, params) => {
        const translation = getNestedValue(translations.en, key);
        return translation ? interpolate(translation, params) : key;
      }}}>
        {children}
      </LocaleContext.Provider>
    );
  }

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;

  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
