'use client';

import { useLocale } from './LocaleContext';

export function useTranslation() {
  const { locale, setLocale, t } = useLocale();
  return { locale, setLocale, t };
}
